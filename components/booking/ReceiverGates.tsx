// ReceiverGates — chip cổng / lối vào ngay dưới một điểm đến (giống điểm đón): chọn cổng → điểm đến dời tới toạ độ cổng,
// địa chỉ giữ nguyên, ghi chú cho tài xế = tên cổng; bấm lại → về điểm cũ. Anh Jacob yêu cầu 2026-10-13.
import React from 'react';
import { EntranceChips } from './EntranceChips';
import { gateLabel, useEntrances } from './useEntrances';
import { setReceiverPlace, updateReceiver, type Receiver } from '@/services/bookingStore';
import type { PlaceEntrance } from '@/services/places';

export const ReceiverGates: React.FC<{ receiver: Receiver; index: number }> = ({ receiver, index }) => {
  const { entrances, selectedGate, show } = useEntrances(receiver.place);
  if (!show || !entrances) return null;
  const pick = (g: PlaceEntrance) => {
    const a = entrances.anchor;
    if (selectedGate?.placeId === g.placeId) {
      setReceiverPlace(index, { ...a, source: 'gate' });
      updateReceiver(index, { gate: '' });
      return;
    }
    setReceiverPlace(index, { ...a, lat: g.lat, lng: g.lng, source: 'gate' });
    updateReceiver(index, { gate: gateLabel(g, entrances.parent) });
  };
  return <EntranceChips parent={entrances.parent} items={entrances.items} selectedId={selectedGate?.placeId ?? null} onPick={pick} />;
};

export default ReceiverGates;
