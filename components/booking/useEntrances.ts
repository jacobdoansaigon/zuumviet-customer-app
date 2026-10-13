// useEntrances — cổng / lối vào (kiểu Grab) của một địa điểm đón hoặc đến: hỏi API khi địa điểm đổi (không phải do chọn
// cổng), chỉ có kết quả khi đúng địa điểm đó có cổng trên bản đồ. Dùng chung cho điểm đón (index) và từng điểm đến.
import { useEffect, useState } from 'react';
import { placeEntrances, type PlaceEntrance } from '@/services/places';
import type { Place } from '@/services/bookingStore';

export interface Entrances {
  anchor: Place;
  parent: string | null;
  items: PlaceEntrance[];
}

export const samePlace = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => Math.abs(a.lat - b.lat) < 1e-6 && Math.abs(a.lng - b.lng) < 1e-6;

/** nhãn ghi chú cho tài xế: "Cổng A (Aeon Mall Tân Phú)" */
export const gateLabel = (g: PlaceEntrance, parent: string | null) => (parent ? `${g.name} (${parent})` : g.name);

export function useEntrances(place: Place | null | undefined, resolving = false) {
  const [entrances, setEntrances] = useState<Entrances | null>(null);
  useEffect(() => {
    if (!place || place.source === 'gate') return;
    if (entrances && samePlace(entrances.anchor, place)) return;
    setEntrances(null);
    let alive = true;
    const anchor = place;
    // tên địa điểm chỉ chắc chắn khi khách chọn từ tìm kiếm (ghim / GPS / vị trí lưu: title không phải tên nơi)
    const name = anchor.source === 'search' && anchor.title && anchor.title !== anchor.address ? anchor.title : undefined;
    placeEntrances(anchor.lat, anchor.lng, name)
      .then((r) => {
        if (alive && r.items.length) setEntrances({ anchor, parent: r.parent, items: r.items });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place?.lat, place?.lng, place?.source, place?.placeId]);
  const selectedGate = place?.source === 'gate' && entrances ? (entrances.items.find((g) => samePlace(g, place)) ?? null) : null;
  const show = !!entrances && !!place && !resolving && (place.source === 'gate' || samePlace(entrances.anchor, place));
  return { entrances, selectedGate, show };
}
