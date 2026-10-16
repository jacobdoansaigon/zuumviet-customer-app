// routeFollow — đặt xe lên tuyến đường thật (màn theo dõi đơn, anh Jacob 16/10/2026: icon bám theo đường đi, đầu xe hướng về
// nơi đến). Tuyến là đường gấp khúc (giải mã từ polyline của Goong); vị trí GPS được chiếu lên tuyến thành "khoảng cách dọc
// tuyến" s (m) — xe chạy tới là s tăng dần, đầu xe theo hướng đoạn đường tại s (chiều đi về đích).
import type { LatLng } from './types';

export interface RoutePath {
  points: LatLng[];
  /** khoảng cách dọc tuyến (m) tại từng điểm, cum[0] = 0 */
  cum: number[];
  length: number;
}

const EARTH_M = 6_371_000;
const rad = (d: number) => (d * Math.PI) / 180;

export function metersBetween(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.sqrt(h));
}

/** hướng từ a tới b (độ, 0 = bắc, theo chiều kim đồng hồ) */
export function bearingBetween(a: LatLng, b: LatLng): number {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** góc lệch nhỏ nhất giữa hai hướng (0–180) */
export const angleDiff = (a: number, b: number) => Math.abs((((a - b) % 360) + 540) % 360 - 180);

/** dựng tuyến (bỏ điểm trùng liên tiếp); < 2 điểm khác nhau → null */
export function buildPath(points: LatLng[] | null | undefined): RoutePath | null {
  if (!points || points.length < 2) return null;
  const pts: LatLng[] = [points[0]!];
  for (const p of points.slice(1)) if (metersBetween(pts[pts.length - 1]!, p) > 0.5) pts.push(p);
  if (pts.length < 2) return null;
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1]! + metersBetween(pts[i - 1]!, pts[i]!));
  return { points: pts, cum, length: cum[cum.length - 1]! };
}

/**
 * Chiếu p lên tuyến: s = khoảng cách dọc tuyến của điểm gần nhất, off = cách tuyến bao xa (m).
 * `hintS` (vị trí cũ): tuyến vòng lại gần chính nó (quay đầu, vòng xoay) thì ưu tiên chỗ phía trước vị trí cũ, tránh xe nhảy lùi.
 */
export function projectOnPath(path: RoutePath, p: LatLng, hintS?: number): { s: number; off: number } {
  // toạ độ phẳng (m) quanh p — đủ chính xác trong vài km
  const mLat = 111_320;
  const mLng = 111_320 * Math.cos(rad(p.lat));
  const xy = (q: LatLng) => ({ x: (q.lng - p.lng) * mLng, y: (q.lat - p.lat) * mLat });
  const cands: { s: number; off: number }[] = [];
  for (let i = 0; i < path.points.length - 1; i++) {
    const a = xy(path.points[i]!);
    const b = xy(path.points[i + 1]!);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    const t = len2 > 0 ? Math.max(0, Math.min(1, -(a.x * dx + a.y * dy) / len2)) : 0;
    const off = Math.hypot(a.x + t * dx, a.y + t * dy);
    cands.push({ s: path.cum[i]! + t * (path.cum[i + 1]! - path.cum[i]!), off });
  }
  let best = cands[0]!;
  for (const c of cands) if (c.off < best.off) best = c;
  if (hintS !== undefined && best.s < hintS - 30) {
    let ahead: { s: number; off: number } | null = null;
    for (const c of cands) if (c.s >= hintS - 30 && c.off <= best.off + 20 && (!ahead || c.off < ahead.off)) ahead = c;
    if (ahead) best = ahead;
  }
  return best;
}

/** điểm tại khoảng cách s dọc tuyến + hướng đoạn đường tại đó (chiều đi về cuối tuyến) */
export function pointAtDistance(path: RoutePath, s: number): LatLng & { bearing: number } {
  const d = Math.max(0, Math.min(path.length, s));
  let i = 0;
  while (i < path.cum.length - 2 && path.cum[i + 1]! < d) i++;
  const a = path.points[i]!;
  const b = path.points[i + 1]!;
  const seg = path.cum[i + 1]! - path.cum[i]!;
  const t = seg > 0 ? (d - path.cum[i]!) / seg : 0;
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t, bearing: bearingBetween(a, b) };
}

/** đoạn tuyến từ s0 tới s1 (gồm hai đầu) — vẽ phần đường còn lại phía trước xe, hoặc lấy khung bản đồ */
export function slicePath(path: RoutePath, s0: number, s1: number = path.length): LatLng[] {
  const a = Math.max(0, Math.min(path.length, s0));
  const b = Math.max(a, Math.min(path.length, s1));
  const start = pointAtDistance(path, a);
  const out: LatLng[] = [{ lat: start.lat, lng: start.lng }];
  for (let i = 0; i < path.points.length; i++) if (path.cum[i]! > a && path.cum[i]! < b) out.push(path.points[i]!);
  const end = pointAtDistance(path, b);
  out.push({ lat: end.lat, lng: end.lng });
  return out;
}
