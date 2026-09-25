// services/intercityTicketStore.ts — trạng thái đặt Mua vé xe đường dài: ngày đi, ghế đã chọn, hàng hoá,
// đón/trả tại nhà hay bến xe. Tách riêng khỏi services/bookingStore.ts vì đây là sản phẩm bán theo GHẾ trên
// 1 chuyến cố định của nhà xe (không phải thuê nguyên xe tính theo khoảng cách như Xe máy/Xe hơi/Tài xế lái thay).
// Xe ghép (đặt yêu cầu → tài xế nhận cuốc) dùng store riêng: services/carpoolRequestStore.ts.
import { useSyncExternalStore } from 'react';
import { getStoredCustomer } from '@/services/api';
import { buildDateOptions, type BusTrip, type PickupOption } from '@/constants/mockIntercity';

export type TicketKind = 'bus';

export interface TicketOrder {
  id: string;
  kind: TicketKind;
  cityId: string;
  tripId: string;
  dateKey: string;
  dateLabel: string;
  departTime: string;
  seatIds: string[];
  hasCargo: boolean;
  cargoNote: string;
  pickup: PickupOption | null;
  dropoff: PickupOption | null;
  contactName: string;
  contactPhone: string;
  unitPrice: number;
  total: number;
  createdAt: number;
}

interface DraftState {
  dateKey: string;
  seatIds: string[];
  hasCargo: boolean;
  cargoNote: string;
  pickup: PickupOption | null;
  dropoff: PickupOption | null;
}

const defaultDateKey = buildDateOptions(1)[0]!.key;

let draft: DraftState = { dateKey: defaultDateKey, seatIds: [], hasCargo: false, cargoNote: '', pickup: null, dropoff: null };
const orders = new Map<string, TicketOrder>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useTicketDraft(): DraftState {
  return useSyncExternalStore(subscribe, () => draft, () => draft);
}
export function getTicketDraft(): DraftState {
  return draft;
}

/** Bắt đầu chọn cho 1 chuyến mới (mở màn chi tiết) — giữ ngày đã chọn ở màn kết quả, xoá ghế/tuỳ chọn cũ */
export function startTicketDraft(dateKey: string) {
  draft = { dateKey, seatIds: [], hasCargo: false, cargoNote: '', pickup: null, dropoff: null };
  emit();
}
export function setDraftDate(dateKey: string) {
  draft = { ...draft, dateKey };
  emit();
}
export function toggleSeat(seatId: string, taken: boolean, max = 6) {
  if (taken) return;
  const has = draft.seatIds.includes(seatId);
  const seatIds = has ? draft.seatIds.filter((s) => s !== seatId) : draft.seatIds.length < max ? [...draft.seatIds, seatId] : draft.seatIds;
  draft = { ...draft, seatIds };
  emit();
}
export function setCargo(hasCargo: boolean, cargoNote = '') {
  draft = { ...draft, hasCargo, cargoNote };
  emit();
}
export function setPickup(p: PickupOption) {
  draft = { ...draft, pickup: p };
  emit();
}
export function setDropoff(p: PickupOption) {
  draft = { ...draft, dropoff: p };
  emit();
}

/** Tên/SĐT liên hệ điền sẵn từ hồ sơ đăng nhập */
export async function getContact(): Promise<{ name: string; phone: string }> {
  try {
    const c = await getStoredCustomer();
    const name = String(c?.full_name ?? c?.fullname ?? '').trim();
    let phone = String(c?.phone ?? '').replace(/\D/g, '');
    if (phone.length === 9) phone = `0${phone}`;
    return { name, phone };
  } catch {
    return { name: '', phone: '' };
  }
}

const uid = () => `tk-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export async function bookBusTrip(trip: BusTrip, dateLabel: string): Promise<TicketOrder> {
  const contact = await getContact();
  const seatCount = Math.max(1, draft.seatIds.length);
  const cargoFee = draft.hasCargo ? trip.cargoFee : 0;
  const pickupFee = draft.pickup?.fee ?? 0;
  const dropoffFee = draft.dropoff?.fee ?? 0;
  const total = trip.pricePerSeat * seatCount + cargoFee + pickupFee + dropoffFee;
  const order: TicketOrder = {
    id: uid(),
    kind: 'bus',
    cityId: trip.cityId,
    tripId: trip.id,
    dateKey: draft.dateKey,
    dateLabel,
    departTime: trip.departTime,
    seatIds: draft.seatIds,
    hasCargo: draft.hasCargo,
    cargoNote: draft.cargoNote,
    pickup: draft.pickup,
    dropoff: draft.dropoff,
    contactName: contact.name,
    contactPhone: contact.phone,
    unitPrice: trip.pricePerSeat,
    total,
    createdAt: Date.now(),
  };
  orders.set(order.id, order);
  emit();
  return order;
}

export function getTicketOrder(id: string): TicketOrder | null {
  return orders.get(id) ?? null;
}
