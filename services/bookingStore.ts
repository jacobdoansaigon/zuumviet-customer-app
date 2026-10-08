// services/bookingStore.ts — bản nháp đơn trong bộ nhớ cho luồng đặt (module state + useSyncExternalStore):
// chọn dịch vụ (catalog thật) → người gửi / điểm đón → người nhận / điểm đến → xác nhận → tạo đơn.
// - Báo giá: POST /v1/customer/quotes (giá + quãng đường do server tính, có hạn `expiresAt`) — giá trên danh sách
//   chọn dịch vụ chỉ là ước tính từ bảng giá catalog.
// - Tạo đơn: POST /v1/customer/orders {quoteId, paymentMethod, pickup/stops (liên hệ + ghi chú theo đúng thứ tự
//   điểm trong báo giá), note}. Server tự chuyển "đang tìm tài xế" / "đã hẹn giờ" — app không gọi thêm bước nào.
// - Chi tiết không có trường riêng trên API (tầng lầu/đóng gói khi dọn nhà, mô tả sự cố gọi thợ, bốc xếp vận tải,
//   tuỳ chọn xem hàng) được ghi vào ghi chú đơn / ghi chú điểm, KHÔNG cộng giá trên app.
import { useSyncExternalStore } from 'react';
import { findService, optionsFor, estimatePrice, type CatalogService, type ServiceOptionView } from '@/services/catalog';
import { getProfile, localPhone } from '@/services/session';
import { reversePlace } from '@/services/places';
import { api, errorMessage, isApiError, onSessionChange, ZuumApiError, type ZuumResponse, type ZuumRoutes } from '@/services/zuum';
import { MOVING_BULKY_ITEMS, SERVICE_GROUPS, TIP_STEP, type ServiceKey, type ViewOptionId } from '@/constants/booking';

// ---------------------------------------------------------------- Kiểu dữ liệu
export interface Place {
  title: string;
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
  savedAddressId?: string;
  /** gps: vị trí hiện tại · search: gợi ý tìm kiếm · saved: vị trí đã lưu · map: ghim bản đồ · history: đơn cũ */
  source: 'gps' | 'search' | 'saved' | 'map' | 'history';
}

export interface Sender {
  name: string;
  phone: string;
  place: Place | null;
}

export interface Receiver {
  id: string;
  name: string;
  phone: string;
  place: Place | null;
  cod: number;
  note: string;
  /** id mức cân nặng trong catalog của dịch vụ đang chọn (null = mức nhẹ nhất) */
  weightTierId: string | null;
  viewOption: ViewOptionId;
  /** Vận tải: hàng lớn/nặng cần người bốc xếp — ghi vào ghi chú điểm (API chưa có phụ phí riêng) */
  needsLoadingHelp: boolean;
}

export type PaymentMethod = 'cash' | 'wallet';

export interface BookingOptions {
  returnToPickup: boolean;
  /** số lần × TIP_STEP */
  tip: number;
  /** epoch ms; null = "Bây giờ" */
  scheduledAt: number | null;
  note: string;
  /** mã giảm giá đã áp (server kiểm tra khi báo giá) */
  couponCode: string | null;
  paymentMethod: PaymentMethod;
  /** dịch vụ cộng thêm (addons của catalog) */
  addonIds: string[];
  /** Thuê nhân công (tính theo block giờ): số block đã chọn → durationMinutes */
  laborBlocks: number;
  /** Dọn nhà: tầng/thang máy 2 đầu + đóng gói / tháo lắp / đồ đặc biệt (ghi chú đơn) */
  movingFloorFrom: number;
  movingElevatorFrom: boolean;
  movingFloorTo: number;
  movingElevatorTo: boolean;
  movingPacking: boolean;
  movingDisassembly: boolean;
  movingBulkyItems: string[];
  /** Gọi thợ: mô tả sự cố + yêu cầu khẩn cấp (ghi chú đơn) */
  handymanIssueNote: string;
  handymanUrgent: boolean;
}

export type Quote = ZuumResponse<'POST /v1/customer/quotes'>;
export type QuoteRequest = ZuumRoutes['POST /v1/customer/quotes']['body'];
export type CreatedOrder = ZuumResponse<'POST /v1/customer/orders'>;

/** Báo giá của server cho bản nháp hiện tại */
export interface ServerQuote {
  status: 'idle' | 'loading' | 'ready' | 'error';
  /** chữ ký yêu cầu báo giá — khác bản nháp hiện tại nghĩa là giá đã cũ */
  key: string;
  quote: Quote | null;
  error: string | null;
  errorCode: string | null;
}

export interface BookingState {
  service: ServiceKey;
  /** id dịch vụ catalog đang chọn ('' khi catalog chưa tải) */
  optionId: string;
  sender: Sender;
  receivers: Receiver[];
  options: BookingOptions;
  quote: ServerQuote;
}

// ---------------------------------------------------------------- Store
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const defaultOptions = (): BookingOptions => ({
  returnToPickup: false,
  tip: 0,
  scheduledAt: null,
  note: '',
  couponCode: null,
  paymentMethod: 'cash',
  addonIds: [],
  laborBlocks: 1,
  movingFloorFrom: 0,
  movingElevatorFrom: false,
  movingFloorTo: 0,
  movingElevatorTo: false,
  movingPacking: false,
  movingDisassembly: false,
  movingBulkyItems: [],
  handymanIssueNote: '',
  handymanUrgent: false,
});

const emptyReceiver = (): Receiver => ({
  id: uid(),
  name: '',
  phone: '',
  place: null,
  cod: 0,
  note: '',
  weightTierId: null,
  viewOption: 'view',
  needsLoadingHelp: false,
});

const idleQuote = (): ServerQuote => ({ status: 'idle', key: '', quote: null, error: null, errorCode: null });

function firstOptionId(service: ServiceKey): string {
  const opts = optionsFor(service);
  return (opts.find((o) => !o.paused) ?? opts[0])?.id ?? '';
}

function createInitialState(service: ServiceKey): BookingState {
  return {
    service,
    optionId: firstOptionId(service),
    sender: { name: '', phone: '', place: null },
    receivers: [],
    options: defaultOptions(),
    quote: idleQuote(),
  };
}

let state: BookingState = createInitialState('delivery');
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
const getSnapshot = () => state;

function update(patch: Partial<BookingState> | ((s: BookingState) => Partial<BookingState>)) {
  const p = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...p };
  emit();
}

/** Hook đọc toàn bộ state (tham chiếu ổn định tới khi có thay đổi) */
export function useBooking(): BookingState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
export const getBookingState = () => state;

// đăng xuất / hết phiên: bỏ bản nháp (có tên/SĐT/địa chỉ của người trước)
onSessionChange((event) => {
  if (event !== 'login') state = createInitialState('delivery');
});

// ---------------------------------------------------------------- Actions: dịch vụ / người gửi
export function startBooking(service: ServiceKey) {
  if (state.service === service && state.optionId) return;
  update({ service, optionId: firstOptionId(service), receivers: state.service === service ? state.receivers : [], options: defaultOptions(), quote: idleQuote() });
}

/** Catalog vừa tải xong / đổi → bảo đảm đang chọn 1 dịch vụ có thật trong nhóm */
export function syncOptionWithCatalog() {
  const opts = optionsFor(state.service);
  if (!opts.length) return;
  if (!opts.some((o) => o.id === state.optionId)) update({ optionId: firstOptionId(state.service) });
}

/** Đổi dịch vụ ngay trong màn đặt (vd Xe máy ⇄ Xe hơi) mà không reset điểm đón/điểm đến */
export function switchRideOption(service: ServiceKey, optionId: string) {
  if (state.service === service && state.optionId === optionId) return;
  update((s) => ({ service, optionId, options: { ...s.options, addonIds: [] } }));
}

/** Thuê nhân công: chọn hạng mục kèm số block thời gian làm việc */
export function selectLaborOption(service: ServiceKey, optionId: string, blocks: number) {
  update((s) => ({ service, optionId, options: { ...s.options, addonIds: [], laborBlocks: Math.max(1, Math.round(blocks) || 1) } }));
}

/** Điền tên/SĐT người gửi từ hồ sơ đã đăng nhập (chỉ khi còn trống) */
export async function hydrateSender() {
  if (state.sender.name && state.sender.phone) return;
  const p = await getProfile();
  if (!p) return;
  const name = p.fullName.trim();
  const phone = localPhone(p.phone);
  update((s) => ({ sender: { ...s.sender, name: s.sender.name || name, phone: s.sender.phone || phone } }));
}

export function setSenderInfo(info: { name?: string; phone?: string }) {
  update((s) => ({ sender: { ...s.sender, ...info } }));
}

export function setSenderPlace(place: Place) {
  update((s) => ({ sender: { ...s.sender, place } }));
}

/** Chưa có điểm đón: lấy vị trí GPS hiện tại, đổi ra địa chỉ chữ qua API (lỗi thì để khách tự chọn) */
export async function pickupFromGps(lat: number, lng: number) {
  if (state.sender.place) return;
  try {
    const p = await reversePlace(lat, lng);
    if (state.sender.place) return;
    setSenderPlace({ title: p.name ?? 'Vị trí hiện tại', address: p.address, lat: p.lat, lng: p.lng, placeId: p.placeId, source: 'gps' });
  } catch {
    /* giữ trống — khách tự chọn điểm đón */
  }
}

/** "Đặt lại" từ đơn cũ: điền sẵn điểm đón + các điểm đến (toạ độ thật của đơn) */
export function prefillRoute(pickup: Place | null, stops: Place[]) {
  const isRide = SERVICE_GROUPS[state.service].kind !== 'delivery';
  update((s) => ({
    sender: pickup ? { ...s.sender, place: pickup } : s.sender,
    receivers: stops.length
      ? stops.map((place) => ({ ...emptyReceiver(), place, name: isRide ? s.sender.name : '', phone: isRide ? s.sender.phone : '' }))
      : s.receivers,
  }));
}

// ---------------------------------------------------------------- Actions: người nhận
export function addReceiver(): number {
  const index = state.receivers.length;
  update((s) => ({ receivers: [...s.receivers, emptyReceiver()] }));
  return index;
}

export function ensureReceiver(index: number) {
  if (index < 0 || state.receivers[index]) return;
  const next = [...state.receivers];
  while (next.length <= index) next.push(emptyReceiver());
  update({ receivers: next });
}

export function updateReceiver(index: number, patch: Partial<Receiver>) {
  ensureReceiver(index);
  update((s) => ({ receivers: s.receivers.map((r, i) => (i === index ? { ...r, ...patch } : r)) }));
}

export function setReceiverPlace(index: number, place: Place) {
  updateReceiver(index, { place });
}

export function removeReceiver(index: number) {
  update((s) => ({ receivers: s.receivers.filter((_, i) => i !== index) }));
}

export function isReceiverComplete(r: Receiver, s: BookingState = state): boolean {
  if (!r.place) return false;
  // Chở khách: điểm đến chỉ cần địa chỉ (tên & SĐT mặc định của người đặt)
  if (SERVICE_GROUPS[s.service].kind !== 'delivery') return true;
  return r.name.trim().length > 0 && isValidPhoneVn(r.phone);
}

/** Bỏ các người nhận bỏ dở (quay lại màn đặt mà chưa điền xong) */
export function pruneIncompleteReceivers() {
  if (state.receivers.every((r) => isReceiverComplete(r))) return;
  update((s) => ({ receivers: s.receivers.filter((r) => isReceiverComplete(r, s)) }));
}

export function setOptions(patch: Partial<BookingOptions>) {
  update((s) => ({ options: { ...s.options, ...patch } }));
}

/** Xoá bản nháp sau khi tạo đơn (giữ người gửi & dịch vụ) */
export function resetDraft() {
  update({ receivers: [], options: defaultOptions(), quote: idleQuote() });
}

// ---------------------------------------------------------------- Dịch vụ đang chọn
export function getSelectedService(s: BookingState = state): CatalogService | null {
  return findService(s.optionId);
}

/** Số điểm đến tối đa của dịch vụ đang chọn (0 = dịch vụ tận nơi) */
export function maxStopsOf(s: BookingState = state): number {
  return getSelectedService(s)?.rules.maxStops ?? SERVICE_GROUPS[s.service].maxStops;
}

export function completeReceivers(s: BookingState = state): Receiver[] {
  return s.receivers.filter((r) => isReceiverComplete(r, s));
}

/** Bản nháp đủ dữ liệu để báo giá (có dịch vụ, điểm đón + ít nhất 1 điểm đến nếu dịch vụ có điểm đến) */
export function isDraftReady(s: BookingState = state): boolean {
  if (!s.sender.place || !getSelectedService(s)) return false;
  if (maxStopsOf(s) === 0) return true;
  return completeReceivers(s).length > 0;
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Quãng đường ƯỚC LƯỢNG theo thứ tự điểm (đường chim bay ×1.3) — chỉ để ước tính giá trên danh sách */
export function routeDistanceKm(s: BookingState = state): number {
  const pickup = s.sender.place;
  const stops = completeReceivers(s).map((r) => r.place!);
  if (!pickup || stops.length === 0) return 0;
  let km = 0;
  let prev: { lat: number; lng: number } = pickup;
  for (const p of stops) {
    km += haversineKm(prev, p);
    prev = p;
  }
  if (s.options.returnToPickup) km += haversineKm(prev, pickup);
  return Math.round(km * 1.3 * 10) / 10;
}

function resolveWeightTier(tierId: string | null, svc: CatalogService): string | null {
  if (!tierId || !svc.weightTiers.length) return null;
  if (svc.weightTiers.some((t) => t.id === tierId)) return tierId;
  return null;
}

/** Giá ước tính (catalog) cho 1 lựa chọn dịch vụ với lộ trình hiện tại */
export function estimateFor(option: ServiceOptionView, s: BookingState = state): number {
  const svc = option.service;
  const stops = completeReceivers(s);
  const weightSurcharge = stops.reduce((sum, r) => sum + (svc.weightTiers.find((t) => t.id === r.weightTierId)?.surcharge ?? 0), 0);
  const blocks = option.id === s.optionId ? s.options.laborBlocks : 1;
  return estimatePrice(svc, {
    distanceMeters: routeDistanceKm(s) * 1000,
    stopCount: Math.max(1, stops.length),
    durationMinutes: option.blockMinutes ? option.blockMinutes * blocks : null,
    weightSurcharge,
  });
}

// ---------------------------------------------------------------- Yêu cầu báo giá / tạo đơn
/** Body POST /v1/customer/quotes cho bản nháp (null khi chưa đủ dữ liệu) */
export function buildQuoteRequest(s: BookingState = state, couponCode: string | null = s.options.couponCode): QuoteRequest | null {
  const svc = getSelectedService(s);
  const pickup = s.sender.place;
  if (!svc || !pickup || !isDraftReady(s)) return null;
  const o = s.options;
  const stops = maxStopsOf(s) === 0 ? [] : completeReceivers(s);
  const blockMinutes = svc.pricing.basis === 'time_block' ? svc.pricing.blockMinutes : 0;
  const addonIds = o.addonIds.filter((id) => svc.addons.some((a) => a.id === id));
  return {
    serviceId: svc.id,
    pickup: { lat: pickup.lat, lng: pickup.lng, address: pickup.address },
    stops: stops.map((r) => ({
      lat: r.place!.lat,
      lng: r.place!.lng,
      address: r.place!.address,
      codAmount: svc.rules.allowCod ? r.cod : 0,
      weightTierId: resolveWeightTier(r.weightTierId, svc),
    })),
    returnToPickup: svc.rules.allowReturnToPickup && o.returnToPickup,
    scheduledAt: o.scheduledAt ? new Date(o.scheduledAt).toISOString() : null,
    ...(blockMinutes > 0 ? { durationMinutes: Math.max(1, o.laborBlocks) * blockMinutes } : {}),
    addonIds,
    tip: o.tip * TIP_STEP,
    ...(couponCode ? { couponCode } : {}),
  };
}

const VIEW_NOTE: Record<ViewOptionId, string> = {
  view: 'Được xem hàng',
  view_check: 'Được xem và kiểm hàng',
  no_view: 'Không được xem hàng',
};

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);
const joinNote = (parts: string[]) => parts.map((p) => p.trim()).filter(Boolean).join(' · ');

/** Dọn nhà: tầng lầu/thang máy 2 đầu + đóng gói + tháo lắp + đồ đặc biệt */
function movingNote(o: BookingOptions): string {
  const floorText = (label: string, floor: number, elevator: boolean) =>
    floor > 0 ? `${label}: tầng ${floor}${elevator ? ' (có thang máy)' : ' (không thang máy)'}` : '';
  const items = o.movingBulkyItems.map((id) => MOVING_BULKY_ITEMS.find((i) => i.id === id)?.label ?? '').filter(Boolean);
  return joinNote([
    floorText('Nhà cũ', o.movingFloorFrom, o.movingElevatorFrom),
    floorText('Nhà mới', o.movingFloorTo, o.movingElevatorTo),
    o.movingPacking ? 'Cần đóng gói đồ đạc' : '',
    o.movingDisassembly ? 'Cần tháo lắp nội thất' : '',
    items.length ? `Đồ đặc biệt: ${items.join(', ')}` : '',
  ]);
}

/** Gọi thợ: mô tả sự cố + khẩn cấp */
function handymanNote(o: BookingOptions): string {
  return joinNote([o.handymanIssueNote.trim() ? `Sự cố: ${o.handymanIssueNote.trim()}` : '', o.handymanUrgent ? 'Yêu cầu xử lý khẩn cấp' : '']);
}

/** Body POST /v1/customer/orders */
export function buildOrderBody(s: BookingState, quoteId: string): ZuumRoutes['POST /v1/customer/orders']['body'] {
  const group = SERVICE_GROUPS[s.service];
  const o = s.options;
  const isDelivery = group.kind === 'delivery';
  const stops = maxStopsOf(s) === 0 ? [] : completeReceivers(s);
  const contactPhone = (p: string) => (isValidPhoneVn(p) ? p.replace(/[\s.-]/g, '') : undefined);
  return {
    quoteId,
    paymentMethod: o.paymentMethod,
    pickup: {
      contactName: s.sender.name.trim() || undefined,
      contactPhone: contactPhone(s.sender.phone),
    },
    // Giao hàng / dọn nhà / vận tải: liên hệ + ghi chú từng điểm; chở khách: không có người nhận riêng
    stops: isDelivery
      ? stops.map((r) => ({
          contactName: r.name.trim() || undefined,
          contactPhone: contactPhone(r.phone),
          note:
            clip(
              joinNote([
                r.note,
                s.service === 'delivery' ? VIEW_NOTE[r.viewOption] : '',
                s.service === 'transport' && r.needsLoadingHelp ? 'Cần người bốc xếp' : '',
              ]),
              500,
            ) || undefined,
        }))
      : [],
    note:
      clip(joinNote([o.note, s.service === 'rental' ? movingNote(o) : '', s.service === 'handyman' ? handymanNote(o) : '']), 1000) || undefined,
  };
}

// ---------------------------------------------------------------- Báo giá
const QUOTE_SAFETY_MS = 20_000;

function quoteIsFresh(q: ServerQuote, key: string): q is ServerQuote & { status: 'ready'; quote: Quote } {
  return q.status === 'ready' && q.key === key && !!q.quote && Date.parse(q.quote.expiresAt) - QUOTE_SAFETY_MS > Date.now();
}

let quoteSeq = 0;

/**
 * Báo giá bản nháp hiện tại. Bỏ qua nếu đã có báo giá còn hạn cho đúng bản nháp này (chữ ký = body yêu cầu).
 * Lỗi (ngoài vùng phục vụ, sai mã giảm giá, hẹn giờ quá sớm…) ghi vào quote.error để màn xác nhận hiện.
 */
export async function refreshQuote(force = false): Promise<ServerQuote> {
  const s = state;
  const req = buildQuoteRequest(s);
  if (!req) {
    if (s.quote.status !== 'idle') update({ quote: idleQuote() });
    return state.quote;
  }
  const key = JSON.stringify(req);
  if (!force && (quoteIsFresh(s.quote, key) || (s.quote.status === 'loading' && s.quote.key === key))) return s.quote;
  const seq = ++quoteSeq;
  update((cur) => ({ quote: { ...cur.quote, status: 'loading', key, error: null, errorCode: null } }));
  try {
    const quote = await api('POST /v1/customer/quotes', { body: req });
    if (seq !== quoteSeq) return state.quote;
    update({ quote: { status: 'ready', key, quote, error: null, errorCode: null } });
  } catch (e) {
    if (seq !== quoteSeq) return state.quote;
    update({ quote: { status: 'error', key, quote: null, error: errorMessage(e), errorCode: e instanceof ZuumApiError ? e.code : null } });
  }
  return state.quote;
}

/** Báo giá còn hạn của đúng bản nháp hiện tại (null nếu chưa có / đã cũ) */
export function currentQuote(s: BookingState = state): Quote | null {
  const req = buildQuoteRequest(s);
  if (!req) return null;
  return quoteIsFresh(s.quote, JSON.stringify(req)) ? s.quote.quote : null;
}

/** Thử áp mã giảm giá: báo giá lại với mã này — server từ chối thì ném lỗi (giữ nguyên mã cũ) */
export async function applyCoupon(code: string): Promise<NonNullable<Quote['coupon']>> {
  const normalized = code.trim().toUpperCase();
  const req = buildQuoteRequest(state, normalized);
  if (!req) throw new ZuumApiError(0, 'draft.incomplete', 'Vui lòng nhập đủ lộ trình trước khi áp mã giảm giá');
  const quote = await api('POST /v1/customer/quotes', { body: req });
  if (!quote.coupon) throw new ZuumApiError(422, 'coupon.not_applied', 'Mã giảm giá không áp dụng được cho đơn này');
  quoteSeq += 1;
  update((s) => ({
    options: { ...s.options, couponCode: normalized },
    quote: { status: 'ready', key: JSON.stringify(req), quote, error: null, errorCode: null },
  }));
  return quote.coupon;
}

export function removeCoupon() {
  setOptions({ couponCode: null });
}

/** Giá hiển thị: giá server nếu báo giá còn hạn cho bản nháp, ngược lại ước tính từ catalog */
export function effectivePrice(s: BookingState = state): { total: number; original: number; distanceKm: number; fromServer: boolean; quote: Quote | null } {
  const q = currentQuote(s);
  if (q) {
    return { total: q.price.total, original: q.price.total + q.price.discount, distanceKm: q.distanceMeters / 1000, fromServer: true, quote: q };
  }
  const svc = getSelectedService(s);
  const view = svc ? optionsFor(s.service).find((o) => o.id === svc.id) : null;
  const total = view ? estimateFor(view, s) + s.options.tip * TIP_STEP : 0;
  return { total, original: total, distanceKm: routeDistanceKm(s), fromServer: false, quote: null };
}

// ---------------------------------------------------------------- Tạo đơn
/**
 * Tạo đơn từ báo giá còn hạn (báo giá lại nếu cần). Báo giá hết hạn giữa chừng (410 quote.expired): báo giá lại để
 * khách xem giá mới rồi bấm xác nhận lần nữa — không tự tạo đơn với giá khác giá khách đã thấy.
 */
export async function submitBooking(): Promise<CreatedOrder> {
  let quote = currentQuote();
  if (!quote) {
    const q = await refreshQuote(true);
    if (q.status !== 'ready' || !q.quote) {
      throw new ZuumApiError(0, q.errorCode ?? 'quote.unavailable', q.error ?? 'Chưa lấy được giá, vui lòng thử lại');
    }
    quote = q.quote;
  }
  try {
    const created = await api('POST /v1/customer/orders', { body: buildOrderBody(state, quote.id) });
    resetDraft();
    return created;
  } catch (e) {
    if (isApiError(e, 'quote.expired', 'quote.not_found', 'coupon.changed')) void refreshQuote(true);
    throw e;
  }
}

// ---------------------------------------------------------------- Format helpers
export function formatVnd(n: number, opts?: { space?: boolean }): string {
  const s = Math.round(Math.abs(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${n < 0 ? '-' : ''}đ${opts?.space ? ' ' : ''}${s}`;
}

export function formatThousands(digits: string): string {
  return digits.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function isValidPhoneVn(p: string): boolean {
  return /^(0|\+?84)\d{9}$/.test(p.replace(/[\s.-]/g, ''));
}

const two = (n: number) => String(n).padStart(2, '0');

/** "Bây giờ" | "18h30" | "Ngày mai, 08h00" | "25/09, 08h00" */
export function formatScheduleLabel(ts: number | null): string {
  if (!ts) return 'Bây giờ';
  const d = new Date(ts);
  const now = new Date();
  const time = `${two(d.getHours())}h${two(d.getMinutes())}`;
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return time;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return `Ngày mai, ${time}`;
  return `${two(d.getDate())}/${two(d.getMonth() + 1)}, ${time}`;
}
