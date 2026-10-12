// useRadar — hoạt ảnh vòng quét tìm tài xế trên bản đồ: vòng ngoài (bán kính đang quét, nét đứt) + xung lan từ tâm ra
// mép rồi mờ dần, lặp liên tục. Bán kính đổi (sang vòng kế) thì vòng ngoài nở mượt tới bán kính mới.
// Cập nhật ~15 khung/giây bằng GeoJSON (đa giác 64 cạnh) — rẻ cho cả MapLibre native lẫn web.
import { useEffect, useRef, useState } from 'react';
import { radarFeatures, type ZMapRadar } from './types';

const TICK_MS = 66;
const PULSE_MS = 2400;
const GROW_MS = 600;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

interface Grow {
  from: number;
  to: number;
  since: number;
}
const outerAt = (g: Grow, now: number) => g.from + (g.to - g.from) * easeInOut(Math.min(1, (now - g.since) / GROW_MS));

export function useRadar(radar: ZMapRadar | null | undefined): GeoJSON.FeatureCollection | null {
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(null);
  const grow = useRef<Grow | null>(null);
  const key = radar ? `${radar.center.lat.toFixed(5)},${radar.center.lng.toFixed(5)}:${Math.round(radar.radiusMeters)}` : '';

  useEffect(() => {
    if (!radar) {
      grow.current = null;
      setData(null);
      return;
    }
    const now = Date.now();
    const prev = grow.current;
    grow.current = { from: prev ? outerAt(prev, now) : radar.radiusMeters * 0.25, to: radar.radiusMeters, since: now };
    const center = radar.center;
    const started = now;
    const tick = () => {
      const t = Date.now();
      const g = grow.current;
      if (!g) return;
      const outer = outerAt(g, t);
      const p = ((t - started) % PULSE_MS) / PULSE_MS;
      setData(radarFeatures(center, outer, outer * easeOutCubic(p), 1 - p));
    };
    tick();
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return data;
}
