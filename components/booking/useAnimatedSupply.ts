// useAnimatedSupply — icon tài xế trong vòng quét trượt mượt giữa hai lần hỏi server (mỗi 5 s): mỗi xe đi từ chỗ đang hiện
// tới vị trí mới trong đúng một chu kỳ hỏi nên chạy liên tục thay vì nhảy cóc. Hướng = heading server trả về (xe mô phỏng
// chạy theo tuyến đường thật); tài xế thật không có heading thì tính từ chiều di chuyển, đứng yên thì giữ hướng cũ.
import { useEffect, useRef, useState } from 'react';
import type { SupplyMarkerData } from '@/services/supply';

type Pos = { lat: number; lng: number };
type Track = { from: Pos; to: Pos; heading: number | null; start: number; data: SupplyMarkerData };

export type AnimatedSupplyMarker = SupplyMarkerData & { heading: number | null };

/** ~8 khung hình / giây — đủ mượt cho xe chạy 20–30 km/h trên bản đồ, nhẹ cho máy yếu */
const FRAME_MS = 125;
const M_PER_DEG = 111_320;

function metersBetween(a: Pos, b: Pos): number {
  const dy = (b.lat - a.lat) * M_PER_DEG;
  const dx = (b.lng - a.lng) * M_PER_DEG * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dx, dy);
}

function bearing(a: Pos, b: Pos): number {
  const dy = (b.lat - a.lat) * M_PER_DEG;
  const dx = (b.lng - a.lng) * M_PER_DEG * Math.cos((a.lat * Math.PI) / 180);
  return (((Math.atan2(dx, dy) * 180) / Math.PI) % 360 + 360) % 360;
}

function positionAt(t: Track, now: number, durationMs: number): Pos {
  const k = Math.min(1, Math.max(0, (now - t.start) / durationMs));
  return { lat: t.from.lat + (t.to.lat - t.from.lat) * k, lng: t.from.lng + (t.to.lng - t.from.lng) * k };
}

export function useAnimatedSupply(targets: SupplyMarkerData[], durationMs: number): AnimatedSupplyMarker[] {
  const tracks = useRef(new Map<string, Track>());
  const [, setFrame] = useState(0);

  // vị trí mới từ server: xuất phát từ chỗ đang hiện (người mới xuất hiện ngay tại chỗ)
  useEffect(() => {
    const now = Date.now();
    const next = new Map<string, Track>();
    for (const t of targets) {
      const prev = tracks.current.get(t.key);
      const from = prev ? positionAt(prev, now, durationMs) : { lat: t.lat, lng: t.lng };
      const to = { lat: t.lat, lng: t.lng };
      const moved = metersBetween(from, to);
      const heading = t.heading ?? (prev && moved > 3 ? bearing(from, to) : (prev?.heading ?? null));
      next.set(t.key, { from, to, heading, start: now, data: t });
    }
    tracks.current = next;
    setFrame((f) => f + 1);
  }, [targets, durationMs]);

  // chạy khung hình chỉ khi còn xe đang trượt
  const hasTargets = targets.length > 0;
  useEffect(() => {
    if (!hasTargets) return;
    const id = setInterval(() => {
      const now = Date.now();
      for (const t of tracks.current.values()) {
        if (now - t.start < durationMs && metersBetween(t.from, t.to) > 0.5) {
          setFrame((f) => f + 1);
          return;
        }
      }
    }, FRAME_MS);
    return () => clearInterval(id);
  }, [hasTargets, durationMs]);

  const now = Date.now();
  return [...tracks.current.values()].map((t) => ({ ...t.data, ...positionAt(t, now, durationMs), heading: t.heading }));
}
