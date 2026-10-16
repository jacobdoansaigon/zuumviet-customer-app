// useLiveVehicle — xe của tài xế trên màn theo dõi đơn (anh Jacob 16/10/2026): icon đúng loại xe, nằm trên tuyến đường thật,
// đầu xe hướng về nơi đến, chạy mượt dọc theo đường giữa hai lần nhận GPS; bản đồ phóng gần quanh xe + đoạn đường phía trước.
//
// - Chặng: xe đang tới điểm đón (assigned) → tuyến xe → điểm đón; đang chở / đang giao (picked_up) → tuyến xe → điểm đến kế.
//   Tuyến lấy từ GET /v1/customer/routes/shape (Goong qua server, cache) — đang giao mà xe còn nằm trên tuyến đã báo giá thì
//   dùng luôn tuyến đó. Xe lệch khỏi tuyến > 60 m (đi đường khác) → lấy tuyến mới từ vị trí hiện tại (≥ 15 s một lần).
// - Vị trí GPS được chiếu lên tuyến (khoảng cách dọc tuyến s); GPS chập chờn lùi vài mét thì giữ nguyên, không cho xe lùi.
// - Hai lần nhận GPS: xe trượt dọc tuyến trong đúng khoảng thời gian giữa hai lần nhận (1–35 s, 10 khung / giây) để xe chạy
//   liên tục, không "chạy rồi đứng" khi GPS về 30 s / lần (đổi lại xe hiện chậm hơn thực tế ~1 nhịp GPS).
// - Khung bản đồ: xe + ~900 m đường phía trước (tới điểm đến nếu gần hơn), chỉ canh lại khi xe đi thêm ~300 m / đổi chặng —
//   không thu nhỏ cả lộ trình (anh Jacob: "zoom in rõ hơn, thấy chi tiết quãng đường đi").
import { useEffect, useMemo, useRef, useState } from 'react';
import { bearingBetween, buildPath, metersBetween, pointAtDistance, projectOnPath, slicePath, type RoutePath } from '@/components/map/routeFollow';
import { decodePolyline } from '@/components/map/polyline';
import { routeModeOf, routeShape } from '@/services/places';
import { nextTarget, type OrderDetail } from '@/services/orders';

type LatLng = { lat: number; lng: number };

export interface PartnerFix {
  lat: number;
  lng: number;
  heading: number | null;
  /** thời điểm đo (ISO) — chỉ nhận điểm mới hơn */
  at: string;
}

interface Leg {
  key: string;
  path: RoutePath;
  /** thời gian chạy cả tuyến theo Goong (s) — null khi tuyến lấy từ báo giá / nối thẳng */
  durationSeconds: number | null;
}

interface Shown extends LatLng {
  heading: number;
  /** vị trí dọc tuyến của chặng `legKey` (null = không bám được tuyến, hiện đúng toạ độ GPS) */
  s: number | null;
  legKey: string | null;
}

export interface LiveVehicle {
  /** vị trí + hướng đang vẽ (đã trượt mượt) */
  position: (LatLng & { heading: number }) | null;
  /** đoạn đường còn lại từ xe tới điểm kế (bám đường) */
  ahead: LatLng[] | null;
  /** khung bản đồ: đổi `key` → canh lại */
  fit: { key: string; points: LatLng[] } | null;
  /** số phút (khoảng) tới điểm kế theo tuyến */
  etaMinutes: number | null;
}

const OFF_ROUTE_M = 60;
const REROUTE_MIN_GAP_MS = 15_000;
const AHEAD_FIT_M = 900;
const REFIT_MOVE_M = 300;
const FRAME_MS = 100;
/** trượt tối đa (GPS 30 s / lần khi khách đang xem + trễ mạng) */
const MAX_GLIDE_MS = 35_000;
/** GPS lùi ít hơn mức này (đang dừng đèn đỏ, sai số) thì giữ xe đứng yên */
const JITTER_BACK_M = 25;
/** tốc độ ước lượng khi không có thời gian của Goong (km/h) */
const FALLBACK_KMH = 25;

export function useLiveVehicle(order: OrderDetail | null, fix: PartnerFix | null, enabled: boolean): LiveVehicle {
  const target = order && enabled ? nextTarget(order) : null;
  const targetKey = order && target ? `${order.status}:${target.lat.toFixed(5)},${target.lng.toFixed(5)}` : '';
  const mode = routeModeOf(order?.vehicle?.type ?? order?.service.vehicleType);
  const orderPath = useMemo(() => buildPath(decodePolyline(order?.routePolyline)), [order?.routePolyline]);

  const [leg, setLeg] = useState<Leg | null>(null);
  const [shown, setShown] = useState<Shown | null>(null);
  const shownRef = useRef<Shown | null>(null);
  const targetKeyRef = useRef(targetKey);
  targetKeyRef.current = targetKey;
  const fetching = useRef(false);
  const lastFetch = useRef(0);
  const lastArrival = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const show = (v: Shown | null) => {
    shownRef.current = v;
    setShown(v);
  };
  const stopAnim = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };
  useEffect(() => stopAnim, []);

  // ---- chặng (tuyến xe → điểm kế): giữ / dùng tuyến báo giá / lấy tuyến mới ----
  const legNow = leg && leg.key === targetKey ? leg : null;
  useEffect(() => {
    if (!enabled || !fix || !target || !order) return;
    const here = { lat: fix.lat, lng: fix.lng };
    if (legNow && projectOnPath(legNow.path, here, shownRef.current?.legKey === legNow.key ? (shownRef.current.s ?? undefined) : undefined).off <= OFF_ROUTE_M) return;
    // đang chở / đang giao mà xe còn trên tuyến đã báo giá → dùng luôn, khỏi gọi tuyến mới
    if (!legNow && order.status === 'picked_up' && orderPath) {
      const at = projectOnPath(orderPath, here);
      const end = projectOnPath(orderPath, target).s;
      const path = at.off <= OFF_ROUTE_M && end > at.s + 20 ? buildPath(slicePath(orderPath, 0, end)) : null;
      if (path) {
        setLeg({ key: targetKey, path, durationSeconds: null });
        return;
      }
    }
    if (fetching.current || (legNow && Date.now() - lastFetch.current < REROUTE_MIN_GAP_MS)) return;
    fetching.current = true;
    lastFetch.current = Date.now();
    const key = targetKey;
    routeShape([here, target], mode)
      .then((r) => {
        const path = buildPath(decodePolyline(r.polyline));
        if (path && targetKeyRef.current === key) setLeg({ key, path, durationSeconds: r.durationSeconds || null });
      })
      .catch(() => {
        // không lấy được tuyến: chưa có chặng nào thì tạm nối thẳng để vẫn có hướng xe / khung bản đồ
        if (targetKeyRef.current === key) setLeg((cur) => (cur && cur.key === key ? cur : { key, path: buildPath([here, target])!, durationSeconds: null }));
      })
      .finally(() => {
        fetching.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, fix?.at, targetKey, legNow, orderPath, mode]);

  // ---- vị trí GPS mới → đặt lên tuyến, trượt mượt tới đó ----
  useEffect(() => {
    if (!enabled || !fix) {
      stopAnim();
      show(null);
      return;
    }
    const here = { lat: fix.lat, lng: fix.lng };
    const prev = shownRef.current;
    let next: Shown;
    const pr = legNow ? projectOnPath(legNow.path, here, prev?.legKey === legNow.key ? (prev.s ?? undefined) : undefined) : null;
    if (legNow && pr && pr.off <= OFF_ROUTE_M) {
      const prevS = prev?.legKey === legNow.key ? prev.s : null;
      const s = prevS != null && pr.s < prevS && prevS - pr.s < JITTER_BACK_M ? prevS : pr.s;
      const pt = pointAtDistance(legNow.path, s);
      next = { lat: pt.lat, lng: pt.lng, heading: pt.bearing, s, legKey: legNow.key };
    } else {
      // không bám được tuyến (chưa có tuyến / đứng chờ ở điểm đón / lệch đường): đúng toạ độ GPS, đầu xe theo hướng GPS,
      // hướng vừa đi, hoặc hướng ra tuyến đã báo giá
      const moved = prev && metersBetween(prev, here) > 8 ? bearingBetween(prev, here) : null;
      const heading = fix.heading ?? moved ?? prev?.heading ?? (orderPath ? pointAtDistance(orderPath, 0).bearing : 0);
      next = { ...here, heading, s: null, legKey: null };
    }

    const now = Date.now();
    const gap = lastArrival.current ? now - lastArrival.current : 0;
    lastArrival.current = now;
    stopAnim();
    if (!prev || metersBetween(prev, next) > 3000 || metersBetween(prev, next) < 0.5) {
      show(next);
      return;
    }
    const duration = Math.min(MAX_GLIDE_MS, Math.max(1_000, gap));
    const alongRoad = legNow && prev.legKey === next.legKey && prev.s != null && next.s != null && next.s >= prev.s;
    const path = legNow?.path;
    const t0 = now;
    timer.current = setInterval(() => {
      const k = Math.min(1, (Date.now() - t0) / duration);
      if (alongRoad && path) {
        const s = prev.s! + (next.s! - prev.s!) * k;
        const pt = pointAtDistance(path, s);
        show({ lat: pt.lat, lng: pt.lng, heading: pt.bearing, s, legKey: next.legKey });
      } else {
        show({ lat: prev.lat + (next.lat - prev.lat) * k, lng: prev.lng + (next.lng - prev.lng) * k, heading: next.heading, s: k >= 1 ? next.s : null, legKey: next.legKey });
      }
      if (k >= 1) stopAnim();
    }, FRAME_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, fix?.at, fix?.lat, fix?.lng, legNow]);

  // ---- đường còn lại phía trước xe (làm tròn 15 m để không vẽ lại mỗi khung hình) ----
  const sBucket = shown?.s != null && shown.legKey === legNow?.key ? Math.floor(shown.s / 15) : null;
  const ahead = useMemo(() => (legNow && sBucket != null ? slicePath(legNow.path, sBucket * 15) : (legNow?.path.points ?? null)), [legNow, sBucket]);

  // ---- khung bản đồ: xe + đoạn đường phía trước; canh lại khi xe đi thêm ~300 m hoặc đổi chặng ----
  const [fit, setFit] = useState<{ key: string; points: LatLng[] } | null>(null);
  const fitAnchor = useRef<{ at: LatLng; leg: string; n: number } | null>(null);
  useEffect(() => {
    if (!enabled || !fix || !order) {
      fitAnchor.current = null;
      setFit(null);
      return;
    }
    const here = { lat: fix.lat, lng: fix.lng };
    const legId = legNow ? `${legNow.key}:${legNow.path.length.toFixed(0)}` : `none:${order.status}`;
    const a = fitAnchor.current;
    if (a && a.leg === legId && metersBetween(a.at, here) < REFIT_MOVE_M) return;
    let points: LatLng[];
    if (legNow) {
      const s = projectOnPath(legNow.path, here).s;
      points = [here, ...slicePath(legNow.path, s, s + AHEAD_FIT_M)];
    } else {
      // đứng ở điểm đón / đang làm tại chỗ: xe + điểm đón (khung tối thiểu ~400 m — phóng gần)
      points = [here, { lat: order.pickup.lat, lng: order.pickup.lng }];
    }
    const n = (a?.n ?? 0) + 1;
    fitAnchor.current = { at: here, leg: legId, n };
    setFit({ key: `live:${n}`, points });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, fix?.at, legNow, order?.status]);

  // ---- ETA theo tuyến ----
  let etaMinutes: number | null = null;
  if (legNow && shown?.s != null && shown.legKey === legNow.key) {
    const left = Math.max(0, legNow.path.length - shown.s);
    const seconds = legNow.durationSeconds ? (legNow.durationSeconds * left) / legNow.path.length : (left / 1000 / FALLBACK_KMH) * 3600;
    etaMinutes = Math.max(1, Math.round(seconds / 60));
  }

  return {
    position: shown ? { lat: shown.lat, lng: shown.lng, heading: shown.heading } : null,
    ahead: ahead && ahead.length >= 2 ? ahead : null,
    fit,
    etaMinutes,
  };
}
