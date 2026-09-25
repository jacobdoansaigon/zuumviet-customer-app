// services/carpoolRequestStore.ts — "Xe ghép" kiểu ĐẶT YÊU CẦU (khác Mua vé xe): khách chọn số chỗ, thời gian,
// hàng hoá, nơi trả (tận nơi hay ra bến gần) rồi GỬI YÊU CẦU. Tài xế đang chạy xe ghép tuyến đó "nhận cuốc"
// (mô phỏng) rồi hệ thống mới hiện chi tiết xe/tài xế cho khách — khác với Mua vé xe (duyệt sẵn từng chuyến,
// chọn ghế ngay). Tách riêng khỏi services/intercityTicketStore.ts (bán vé theo chuyến cố định của nhà xe).
import { useSyncExternalStore } from 'react';
import { carpoolsForCity, type CarpoolListing } from '@/constants/mockIntercity';
import { getContact } from '@/services/intercityTicketStore';

export type CarpoolRequestStatus = 'searching' | 'matched' | 'cancelled';
export type DropoffPref = 'home' | 'station';

export interface CarpoolRequest {
  id: string;
  cityId: string;
  cityName: string;
  destinationLabel: string;
  dateLabel: string;
  timeLabel: string;
  seatCount: number;
  hasCargo: boolean;
  cargoNote: string;
  dropoffPref: DropoffPref;
  contactName: string;
  contactPhone: string;
  status: CarpoolRequestStatus;
  matchedListing: CarpoolListing | null;
  createdAt: number;
  matchedAt: number | null;
}

interface DraftState {
  seatCount: number;
  dateKey: string;
  timeLabel: string;
  hasCargo: boolean;
  cargoNote: string;
  dropoffPref: DropoffPref;
}

function defaultDraft(): DraftState {
  return { seatCount: 1, dateKey: new Date().toISOString().slice(0, 10), timeLabel: '', hasCargo: false, cargoNote: '', dropoffPref: 'station' };
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
export function setCarpoolDate(dateKey: string) {
  draft = { ...draft, dateKey };
  emit();
}
export function setCarpoolTime(timeLabel: string) {
  draft = { ...draft, timeLabel };
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
export async function submitCarpoolRequest(cityId: string, cityName: string, destinationLabel: string, dateLabel: string): Promise<CarpoolRequest> {
  const contact = await getContact();
  const req: CarpoolRequest = {
    id: uid(),
    cityId,
    cityName,
    destinationLabel,
    dateLabel,
    timeLabel: draft.timeLabel || 'Trong hôm nay',
    seatCount: draft.seatCount,
    hasCargo: draft.hasCargo,
    cargoNote: draft.cargoNote,
    dropoffPref: draft.dropoffPref,
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
