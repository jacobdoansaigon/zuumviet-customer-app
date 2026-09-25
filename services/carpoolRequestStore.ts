// services/carpoolRequestStore.ts — "Xe ghép" kiểu ĐẶT YÊU CẦU (khác Mua vé xe): khách chọn số chỗ, lịch trình
// (một chiều mặc định, khởi hành 6:00 sáng, hoặc khứ hồi có ngày giờ về), hàng hoá, nơi trả (tận nơi hay ra
// bến gần) rồi GỬI YÊU CẦU. Tài xế đang chạy xe ghép tuyến đó "nhận cuốc" (mô phỏng) rồi hệ thống mới hiện
// chi tiết xe/tài xế cho khách — khác với Mua vé xe (duyệt sẵn từng chuyến, chọn ghế ngay). Tách riêng khỏi
// services/intercityTicketStore.ts (bán vé theo chuyến cố định của nhà xe).
import { useSyncExternalStore } from 'react';
import {
  buildDateOptions,
  carpoolsForCity,
  defaultTripSchedule,
  estimateCarpoolPrice,
  formatDateOptionLabel,
  type CarpoolListing,
  type TripScheduleValue,
} from '@/constants/mockIntercity';
import { getContact } from '@/services/intercityTicketStore';

export type CarpoolRequestStatus = 'searching' | 'matched' | 'cancelled';
export type DropoffPref = 'home' | 'station';

export interface CarpoolRequest {
  id: string;
  cityId: string;
  cityName: string;
  destinationLabel: string;
  schedule: TripScheduleValue;
  /** đã format sẵn để hiển thị, vd "Hôm nay 25/09 · 06:00" */
  departLabel: string;
  /** rỗng nếu chỉ chiều đi */
  returnLabel: string;
  seatCount: number;
  hasCargo: boolean;
  cargoNote: string;
  dropoffPref: DropoffPref;
  /** Giá dự kiến lúc gửi yêu cầu (tài xế nhận cuốc sẽ báo giá chính thức) */
  unitPrice: number;
  estimatedTotal: number;
  contactName: string;
  contactPhone: string;
  status: CarpoolRequestStatus;
  matchedListing: CarpoolListing | null;
  createdAt: number;
  matchedAt: number | null;
}

interface DraftState {
  seatCount: number;
  schedule: TripScheduleValue;
  hasCargo: boolean;
  cargoNote: string;
  dropoffPref: DropoffPref;
}

// Phủ hết phạm vi ngày mà TripSchedulePicker cho chọn (chiều về xa nhất 23 ngày) để formatDateOptionLabel luôn tìm được nhãn.
const DATE_OPTIONS = buildDateOptions(23);

function defaultDraft(): DraftState {
  return { seatCount: 1, schedule: defaultTripSchedule(DATE_OPTIONS), hasCargo: false, cargoNote: '', dropoffPref: 'station' };
}

let draft: DraftState = defaultDraft();
const requests = new Map<string, CarpoolRequest>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useCarpoolDraft(): DraftState {
  return useSyncExternalStore(subscribe, () => draft, () => draft);
}
export function getCarpoolDraft(): DraftState {
  return draft;
}
export function startCarpoolDraft() {
  draft = defaultDraft();
  emit();
}
export function setSeatCount(n: number) {
  draft = { ...draft, seatCount: Math.max(1, Math.min(6, n)) };
  emit();
}
export function setCarpoolSchedule(patch: Partial<TripScheduleValue>) {
  draft = { ...draft, schedule: { ...draft.schedule, ...patch } };
  emit();
}
export function setCarpoolCargo(hasCargo: boolean, cargoNote = '') {
  draft = { ...draft, hasCargo, cargoNote };
  emit();
}
export function setDropoffPref(pref: DropoffPref) {
  draft = { ...draft, dropoffPref: pref };
  emit();
}

const uid = () => `cq-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** Gửi yêu cầu xe ghép — trạng thái ban đầu "searching", mô phỏng tài xế nhận cuốc do màn tracking tự gọi acceptCarpoolRequest sau vài giây. */
export async function submitCarpoolRequest(cityId: string, cityName: string, destinationLabel: string): Promise<CarpoolRequest> {
  const contact = await getContact();
  const schedule = draft.schedule;
  const estimate = estimateCarpoolPrice(cityId, { seatCount: draft.seatCount, dropoffPref: draft.dropoffPref, hasCargo: draft.hasCargo });
  const req: CarpoolRequest = {
    id: uid(),
    cityId,
    cityName,
    destinationLabel,
    schedule,
    departLabel: `${formatDateOptionLabel(DATE_OPTIONS, schedule.departDateKey)} · ${schedule.departTime}`,
    returnLabel: schedule.tripType === 'roundtrip' ? `${formatDateOptionLabel(DATE_OPTIONS, schedule.returnDateKey)} · ${schedule.returnTime}` : '',
    seatCount: draft.seatCount,
    hasCargo: draft.hasCargo,
    cargoNote: draft.cargoNote,
    dropoffPref: draft.dropoffPref,
    unitPrice: estimate.unitPrice,
    estimatedTotal: estimate.total,
    contactName: contact.name,
    contactPhone: contact.phone,
    status: 'searching',
    matchedListing: null,
    createdAt: Date.now(),
    matchedAt: null,
  };
  requests.set(req.id, req);
  emit();
  return req;
}

/** Mô phỏng 1 tài xế xe ghép đang chạy tuyến này nhận cuốc và gửi chi tiết xe cho khách. */
export function acceptCarpoolRequest(id: string): CarpoolRequest | null {
  const req = requests.get(id);
  if (!req || req.status !== 'searching') return req ?? null;
  const pool = carpoolsForCity(req.cityId).filter((c) => c.seats.filter((s) => !s.taken).length >= req.seatCount && (!req.hasCargo || c.allowsCargo));
  const listing = pool[Math.floor(Math.random() * pool.length)] ?? carpoolsForCity(req.cityId)[0] ?? null;
  const next: CarpoolRequest = { ...req, status: 'matched', matchedListing: listing, matchedAt: Date.now() };
  requests.set(id, next);
  emit();
  return next;
}

export function cancelCarpoolRequest(id: string) {
  const req = requests.get(id);
  if (!req) return;
  requests.set(id, { ...req, status: 'cancelled' });
  emit();
}

export function getCarpoolRequest(id: string): CarpoolRequest | null {
  return requests.get(id) ?? null;
}
export function useCarpoolRequest(id: string): CarpoolRequest | null {
  return useSyncExternalStore(
    subscribe,
    () => requests.get(id) ?? null,
    () => requests.get(id) ?? null,
  );
}
