// services/bookingStore.ts — store nhỏ trong bộ nhớ cho luồng đặt hàng (module state + useSyncExternalStore).
// Giữ bản nháp đơn giữa các bước: chọn dịch vụ → người gửi → người nhận → xác nhận → theo dõi.
// - buildOrderPayload(): dựng body cho orderApi.createOrder theo Controller\Site\DeliveryOrders::add (zv-delivery);
//   service_id lấy từ catalog thật (services/serviceCatalog.ts), không dùng id tạm trong mockBooking.
// - refreshQuote(): POST /drymode để lấy giá + km BE tính (giá hiển thị ở màn xác nhận là giá BE, giá app chỉ là ước tính).
// - submitBooking(): createOrder → startDriverSearch (BE chỉ tìm tài xế khi có process). Lỗi → ném ra cho màn hình
//   báo, KHÔNG còn âm thầm tạo đơn mock (đơn mock chỉ dùng cho demo/QA qua createDemoOrder).
import { useSyncExternalStore } from 'react';
import { orderApi, ORDER_STATUS, PROCESS_STATUS, getStoredCustomer, type DeliveryOrder } from '@/services/api';
import { ensureServiceCatalog, findOptionByServiceId, resolveServiceId, serviceNameById } from '@/services/serviceCatalog';
import {
  SERVICE_GROUPS,
  SERVICE_KEYS,
  EXTRA_PRICES,
  DEFAULT_SENDER_PLACE,
  MOCK_DRIVER,
  FAVORITE_DRIVERS,
  PACKAGE_SIZES,
  FREIGHT_WEIGHTS,
  MOVING_BULKY_ITEMS,
  SAMPLE_PLACES,
  HCM_CENTER,
  type ServiceKey,
  type ServiceOptionDef,
  type PackageSizeId,
  type ViewOptionId,
  type PromoDef,
  type DriverDef,
  type SamplePlace,
} from '@/constants/mockBooking';

// ---------------------------------------------------------------- Kiểu dữ liệu
export interface Place {
  title: string;
  address: string;
  lat: number;
  lng: number;
  savedLocationId?: number;
  placeId?: string;
  /** 'default' = địa chỉ mẫu chưa có GPS thật */
  source?: 'default' | 'gps' | 'search' | 'saved';
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
  packageSize: PackageSizeId;
  viewOption: ViewOptionId;
  handDelivery: boolean;
  /** Vận tải: hàng lớn/nặng cần thêm nhân công bốc xếp lên/xuống (tính thêm phí) */
  needsLoadingHelp: boolean;
}

export type PaymentMethod = 'cash' | 'wallet';

export interface BookingOptions {
  returnToPickup: boolean;
  handToCustomer: number;
  tip: number;
  /** epoch ms; null = "Bây giờ" */
  scheduledAt: number | null;
  /** epoch ms giờ về (chỉ Xe đường dài — Thuê cả xe khứ hồi); null = một chiều */
  returnAt: number | null;
  /** chỉ có ý nghĩa khi returnAt khác null: xe/tài xế có ở lại phục vụ suốt hành trình (đón chiều về) hay không */
  waitForReturn: boolean;
  assignedDrivers: number[];
  note: string;
  promo: PromoDef | null;
  paymentMethod: PaymentMethod;
  /** Thuê nhân công: số block thời gian làm việc đã chọn cho hạng mục đang chọn (xem ServiceOptionDef.blockHours) */
  laborBlocks: number;
  /** Thuê nhân công: số nhân công đã chọn (từ người thứ 2 giảm EXTRA_PRICES.laborGroupDiscountPercent) */
  laborWorkers: number;
  /** Dọn nhà: tầng của nhà/căn hộ CŨ (điểm đi) — 0 = tầng trệt; có thang máy hay không (đủ tầng thì miễn phí) */
  movingFloorFrom: number;
  movingElevatorFrom: boolean;
  /** Dọn nhà: tầng của nhà/căn hộ MỚI (điểm đến) */
  movingFloorTo: number;
  movingElevatorTo: boolean;
  /** Dọn nhà: cần đóng gói (thùng carton, bọc đồ dễ vỡ) / tháo lắp nội thất (giường, tủ, máy lạnh...) */
  movingPacking: boolean;
  movingDisassembly: boolean;
  /** Dọn nhà: id các đồ đặc biệt cần báo trước cho đội bốc xếp (xem MOVING_BULKY_ITEMS) */
  movingBulkyItems: string[];
  /** Gọi thợ: mô tả sự cố cần sửa — hỏi ngay từ màn Thông tin liên hệ, không đợi tới bước Ghi chú cuối cùng */
  handymanIssueNote: string;
  /** Gọi thợ: ảnh hiện trạng đính kèm (uri cục bộ trên máy — BE chưa có API upload ảnh, xem buildOrderPayload) */
  handymanPhotos: string[];
  /** Gọi thợ: xử lý khẩn cấp, ưu tiên điều thợ ngay kể cả ngoài giờ (tính thêm EXTRA_PRICES.urgentCallout) */
  handymanUrgent: boolean;
}

export type StopStatus = 'new' | 'picking' | 'picked' | 'delivering' | 'completed' | 'failed' | 'returned';

export interface TrackedStop {
  name: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
  status: StopStatus;
}

/** Đơn đã chuẩn hoá cho màn theo dõi (từ API hoặc mock) */
export interface TrackedOrder {
  id: string;
  code: string;
  status: number;
  service: ServiceKey;
  optionId: string;
  serviceName: string;
  serviceDescription: string;
  scheduledAt: number | null;
  returnAt: number | null;
  waitForReturn: boolean;
  distanceKm: number;
  promoLabel: string | null;
  paymentMethod: PaymentMethod;
  note: string;
  pickup: TrackedStop;
  stops: TrackedStop[];
  driver: DriverDef | null;
  total: number;
  original: number;
  etaMinutes: number;
  createdAt: number;
  isMock: boolean;
  /**
   * Đơn thật: đợt tìm tài xế gần nhất đã hết hạn mà chưa ai nhận (process COMPLETED/CANCELLED + quá date_expired,
   * đơn vẫn ASSIGNING). BE không tự chuyển FAIL với điều phối thủ công nên app phải tự suy ra để hiện "Không tìm thấy".
   */
  searchExpired?: boolean;
}

/** Giá BE tính qua POST /site/deliveryorders/drymode cho bản nháp hiện tại */
export interface ServerQuote {
  status: 'idle' | 'loading' | 'ready' | 'error';
  total: number;
  /** giá dịch vụ trước giảm giá (price_final_detail.price_service) */
  original: number;
  distanceKm: number;
  error: string | null;
  /** chữ ký bản nháp lúc báo giá — khác với hiện tại nghĩa là giá đã cũ */
  key: string;
}

export interface BookingState {
  service: ServiceKey;
  optionId: string;
  sender: Sender;
  receivers: Receiver[];
  options: BookingOptions;
  /** đơn mock + snapshot đơn thật vừa tạo (key = orderId) */
  orders: Record<string, TrackedOrder>;
  quote: ServerQuote;
}

export interface PriceLine {
  label: string;
  amount: number;
}
export interface PriceSummary {
  base: number;
  lines: PriceLine[];
  subtotal: number;
  discount: number;
  total: number;
  distanceKm: number;
}

export type TrackingPhase = 'scheduled' | 'searching' | 'notfound' | 'accepted' | 'delivering' | 'completed' | 'cancelled';

// ---------------------------------------------------------------- Store
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function placeFromSample(p: SamplePlace, source: Place['source'] = 'search'): Place {
  return { title: p.title, address: p.address, lat: p.lat, lng: p.lng, savedLocationId: p.savedLocationId, placeId: p.id, source };
}

const defaultOptions = (): BookingOptions => ({
  returnToPickup: false,
  handToCustomer: 0,
  tip: 0,
  scheduledAt: null,
  returnAt: null,
  waitForReturn: true,
  assignedDrivers: [],
  note: '',
  promo: null,
  paymentMethod: 'cash',
  laborBlocks: 1,
  laborWorkers: 1,
  movingFloorFrom: 0,
  movingElevatorFrom: false,
  movingFloorTo: 0,
  movingElevatorTo: false,
  movingPacking: false,
  movingDisassembly: false,
  movingBulkyItems: [],
  handymanIssueNote: '',
  handymanPhotos: [],
  handymanUrgent: false,
});

const emptyReceiver = (): Receiver => ({
  id: uid(),
  name: '',
  phone: '',
  place: null,
  cod: 0,
  note: '',
  packageSize: 's',
  viewOption: 'view',
  handDelivery: false,
  needsLoadingHelp: false,
});

const firstOptionId = (service: ServiceKey) => SERVICE_GROUPS[service].options[0]!.id;

const idleQuote = (): ServerQuote => ({ status: 'idle', total: 0, original: 0, distanceKm: 0, error: null, key: '' });

function createInitialState(service: ServiceKey): BookingState {
  return {
    service,
    optionId: firstOptionId(service),
    sender: { name: '', phone: '', place: placeFromSample(DEFAULT_SENDER_PLACE, 'default') },
    receivers: [],
    options: defaultOptions(),
    orders: {},
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

// ---------------------------------------------------------------- Actions: dịch vụ / người gửi
export function startBooking(service: ServiceKey) {
  if (state.service === service) return;
  update({ service, optionId: firstOptionId(service), receivers: [], options: defaultOptions() });
}

export function selectOption(optionId: string) {
  if (state.optionId !== optionId) update({ optionId });
}

/**
 * Đổi loại xe ngay trong màn đặt (vd Xe máy ⇄ Xe hơi, xem URBAN_RIDE_KEYS) mà không reset
 * điểm đón/điểm đến — khác startBooking() vốn dùng khi bắt đầu luồng đặt mới từ Home.
 */
export function switchRideOption(service: ServiceKey, optionId: string) {
  if (state.service === service && state.optionId === optionId) return;
  update({ service, optionId });
}

/**
 * Thuê nhân công: chọn hạng mục kèm số block thời gian làm việc (vd 2 block × 4 giờ = 8 giờ) và số
 * nhân công (xem ServiceOptionDef.blockHours/maxBlocks/maxWorkers). Dùng khi xác nhận từ dialog
 * "Thông tin dịch vụ" thay vì switchRideOption() vì cần lưu thêm 2 lựa chọn này.
 */
export function selectLaborOption(service: ServiceKey, optionId: string, blocks: number, workers: number = 1) {
  update((s) => ({
    service,
    optionId,
    options: { ...s.options, laborBlocks: Math.max(1, Math.round(blocks) || 1), laborWorkers: Math.max(1, Math.round(workers) || 1) },
  }));
}

/** Điền tên/SĐT người gửi từ hồ sơ đã đăng nhập (chỉ khi còn trống) */
export async function hydrateSender() {
  if (state.sender.name && state.sender.phone) return;
  try {
    const c = await getStoredCustomer();
    if (!c) return;
    const name = String(c.full_name ?? c.fullname ?? '').trim();
    let phone = String(c.phone ?? '').replace(/\D/g, '');
    if (phone.length === 9) phone = `0${phone}`;
    update((s) => ({ sender: { ...s.sender, name: s.sender.name || name, phone: s.sender.phone || phone } }));
  } catch {
    /* giữ trống — người dùng tự nhập */
  }
}

export function setSenderInfo(info: { name?: string; phone?: string }) {
  update((s) => ({ sender: { ...s.sender, ...info } }));
}

export function setSenderPlace(place: Place) {
  update((s) => ({ sender: { ...s.sender, place } }));
}

/**
 * Điền sẵn lộ trình từ gợi ý / hoạt động gần đây (id SamplePlace).
 * Chở khách: điểm đến lấy tên/SĐT của người đặt; giao hàng: người dùng bổ sung thông tin người nhận.
 */
export function prefillRoute(fromId?: string, toId?: string) {
  const from = fromId ? SAMPLE_PLACES.find((p) => p.id === fromId) : undefined;
  const to = toId ? SAMPLE_PLACES.find((p) => p.id === toId) : undefined;
  if (!from && !to) return;
  const isRide = SERVICE_GROUPS[state.service].kind !== 'delivery';
  update((s) => ({
    sender: from ? { ...s.sender, place: placeFromSample(from, 'saved') } : s.sender,
    receivers: to
      ? [{ ...emptyReceiver(), place: placeFromSample(to, 'saved'), name: isRide ? s.sender.name : '', phone: isRide ? s.sender.phone : '' }]
      : s.receivers,
  }));
}

/** GPS thật về → thay toạ độ cho địa chỉ mẫu mặc định */
export function applyGpsToDefaultPlace(lat: number, lng: number) {
  const p = state.sender.place;
  if (!p || p.source !== 'default') return;
  update((s) => ({ sender: { ...s.sender, place: { ...p, lat, lng, source: 'gps' } } }));
}

// ---------------------------------------------------------------- Actions: người nhận
export function addReceiver(): number {
  const index = state.receivers.length;
  update((s) => ({ receivers: [...s.receivers, emptyReceiver()] }));
  return index;
}

export function ensureReceiver(index: number) {
  if (index < 0) return;
  if (state.receivers[index]) return;
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

export function isReceiverComplete(r: Receiver): boolean {
  if (!r.place) return false;
  // Chở khách / gọi thợ: điểm đến chỉ cần địa chỉ (tên & SĐT mặc định lấy của người đặt)
  if (SERVICE_GROUPS[state.service].kind !== 'delivery') return true;
  return r.name.trim().length > 0 && r.phone.replace(/\D/g, '').length >= 9;
}

/** Bỏ các người nhận bỏ dở (quay lại màn đặt mà chưa điền xong) */
export function pruneIncompleteReceivers() {
  if (state.receivers.every(isReceiverComplete)) return;
  update((s) => ({ receivers: s.receivers.filter(isReceiverComplete) }));
}

export function setOptions(patch: Partial<BookingOptions>) {
  update((s) => ({ options: { ...s.options, ...patch } }));
}

/** Xoá bản nháp sau khi tạo đơn (giữ người gửi & dịch vụ) */
export function resetDraft() {
  update({ receivers: [], options: defaultOptions(), quote: idleQuote() });
}

// ---------------------------------------------------------------- Giá & khoảng cách
export function getOption(s: BookingState = state, optionId?: string): ServiceOptionDef {
  const id = optionId ?? s.optionId;
  // ID duy nhất trên toàn bộ app → tìm xuyên nhóm để giá xem trước đúng khi các nhóm
  // được gộp chung 1 danh sách (vd Xe máy ⇄ Xe hơi, xem switchRideOption/URBAN_RIDE_KEYS)
  for (const key of SERVICE_KEYS) {
    const found = SERVICE_GROUPS[key].options.find((o) => o.id === id);
    if (found) return found;
  }
  const opts = SERVICE_GROUPS[s.service].options;
  return opts[0]!;
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

/** Tổng quãng đường theo thứ tự điểm (ước lượng đường chim bay ×1.3) */
export function routeDistanceKm(s: BookingState = state): number {
  const pickup = s.sender.place;
  const stops = s.receivers.filter(isReceiverComplete).map((r) => r.place!);
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

export function computePrice(s: BookingState = state, optionId?: string): PriceSummary {
  const opt = getOption(s, optionId);
  const id = optionId ?? s.optionId;
  const distanceKm = routeDistanceKm(s);
  const stops = s.receivers.filter(isReceiverComplete);
  const extraKm = Math.max(0, Math.ceil(distanceKm) - opt.includedKm);
  const extraStops = Math.max(0, stops.length - 1);
  const base = opt.basePrice + extraKm * opt.perKmPrice + extraStops * opt.extraStopPrice;

  const lines: PriceLine[] = [{ label: SERVICE_GROUPS[s.service].labels.feeLabel, amount: base }];
  // Thuê nhân công: thời gian làm việc chọn theo block (opt.blockHours) — chỉ áp giá nhiều block cho
  // ĐÚNG hạng mục đang được chọn; các hạng mục khác trong danh sách vẫn xem giá khởi điểm (1 block).
  const isSelectedLabor = s.service === 'labor' && id === s.optionId;
  const laborBlocks = isSelectedLabor ? Math.max(1, s.options.laborBlocks || 1) : 1;
  if (laborBlocks > 1) {
    lines.push({ label: `Thêm ${laborBlocks - 1} block (${(laborBlocks - 1) * (opt.blockHours ?? 0)} giờ)`, amount: base * (laborBlocks - 1) });
  }
  // Thuê nhân công: mỗi nhân công thêm từ người thứ 2 làm đủ số block như người đầu, được giảm giá
  // (đúng lời hứa "Nhóm từ 2 người: giảm X%/người" đã ghi sẵn ở infoLines từng hạng mục).
  const laborWorkers = isSelectedLabor ? Math.max(1, s.options.laborWorkers || 1) : 1;
  if (laborWorkers > 1) {
    const perWorker = base * laborBlocks;
    const extraWorkers = laborWorkers - 1;
    const discounted = Math.round(perWorker * (1 - EXTRA_PRICES.laborGroupDiscountPercent / 100));
    lines.push({ label: `Thêm ${extraWorkers} nhân công (giảm ${EXTRA_PRICES.laborGroupDiscountPercent}%/người)`, amount: discounted * extraWorkers });
  }
  // Gọi thợ: phụ phí xử lý khẩn cấp, công khai ngay khi khách chọn (không phát sinh ẩn sau khảo sát)
  if (s.service === 'handyman' && s.options.handymanUrgent) {
    lines.push({ label: 'Xử lý khẩn cấp', amount: EXTRA_PRICES.urgentCallout });
  }
  const handDelivery = stops.filter((r) => r.handDelivery).length * EXTRA_PRICES.handDelivery;
  if (handDelivery) lines.push({ label: 'Giao hàng tận tay', amount: handDelivery });
  const loadingHelp = stops.filter((r) => r.needsLoadingHelp).length * EXTRA_PRICES.loadingHelp;
  if (loadingHelp) lines.push({ label: 'Nhân công bốc xếp', amount: loadingHelp });
  // Dọn nhà: phụ phí tầng lầu (mỗi đầu tính riêng, tầng trệt/tầng 1 miễn phí, có thang máy thì luôn miễn phí)
  // + đóng gói + tháo lắp nội thất — không áp cho Giao hàng/Vận tải/dịch vụ khác.
  if (s.service === 'rental') {
    const extraFloorsFrom = s.options.movingElevatorFrom ? 0 : Math.max(0, s.options.movingFloorFrom - 1);
    const extraFloorsTo = s.options.movingElevatorTo ? 0 : Math.max(0, s.options.movingFloorTo - 1);
    const floorFee = (extraFloorsFrom + extraFloorsTo) * EXTRA_PRICES.movingFloorFee;
    if (floorFee) lines.push({ label: 'Phụ phí tầng lầu (không thang máy)', amount: floorFee });
    if (s.options.movingPacking) lines.push({ label: 'Đóng gói đồ đạc', amount: EXTRA_PRICES.movingPacking });
    if (s.options.movingDisassembly) lines.push({ label: 'Tháo lắp nội thất', amount: EXTRA_PRICES.movingDisassembly });
  }
  if (s.options.returnToPickup) lines.push({ label: 'Quay lại điểm giao hàng', amount: EXTRA_PRICES.returnToPickup });
  if (s.options.handToCustomer) lines.push({ label: 'Gửi tận tay khách hàng', amount: s.options.handToCustomer * EXTRA_PRICES.handToCustomer });
  if (s.options.tip) lines.push({ label: 'Tiền tip', amount: s.options.tip * EXTRA_PRICES.tip });

  const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);
  let discount = 0;
  const promo = s.options.promo;
  if (promo) {
    if (promo.percent) discount = Math.round((subtotal * promo.percent) / 100);
    else if (promo.amount) discount = promo.amount;
    if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
    discount = Math.min(discount, subtotal);
  }
  return { base, lines, subtotal, discount, total: Math.max(0, subtotal - discount), distanceKm };
}

export function promoLabel(promo: PromoDef | null): string | null {
  if (!promo) return null;
  if (promo.percent) return `Giảm ${promo.percent}%`;
  if (promo.amount) return `Giảm ${formatVnd(promo.amount)}`;
  return `Mã ${promo.code}`;
}

/** Dọn nhà: gộp tầng lầu/thang máy 2 đầu + đóng gói + tháo lắp + đồ đặc biệt thành 1 dòng ghi chú cho đơn */
function movingNote(s: BookingState): string {
  const o = s.options;
  const floorText = (label: string, floor: number, elevator: boolean) =>
    floor > 0 ? `${label}: tầng ${floor}${elevator ? ' (có thang máy)' : ' (không thang máy)'}` : '';
  const items = o.movingBulkyItems.map((id) => MOVING_BULKY_ITEMS.find((i) => i.id === id)?.label).filter(Boolean);
  return [
    floorText('Nhà cũ', o.movingFloorFrom, o.movingElevatorFrom),
    floorText('Nhà mới', o.movingFloorTo, o.movingElevatorTo),
    o.movingPacking ? 'Cần đóng gói đồ đạc' : '',
    o.movingDisassembly ? 'Cần tháo lắp nội thất' : '',
    items.length ? `Đồ đặc biệt: ${items.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Gọi thợ: gộp mô tả sự cố + số ảnh đính kèm + mức độ khẩn cấp thành 1 dòng ghi chú cho đơn */
function handymanNote(s: BookingState): string {
  const o = s.options;
  return [
    o.handymanIssueNote.trim() ? `Sự cố: ${o.handymanIssueNote.trim()}` : '',
    // Ảnh chỉ lưu cục bộ trên máy khách (uri file:// / blob:) — BE chưa có API upload ảnh nên KHÔNG gửi
    // được ảnh thật lên server, chỉ báo số lượng để thợ biết khách có ảnh, có thể xin gửi qua Zalo/SMS.
    o.handymanPhotos.length ? `Đã chụp ${o.handymanPhotos.length} ảnh hiện trạng (khách giữ trên máy)` : '',
    o.handymanUrgent ? 'Yêu cầu xử lý khẩn cấp' : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

// ---------------------------------------------------------------- Payload BE
/** Bản nháp đã có đủ dữ liệu để gửi lên BE chưa (có điểm đón + ít nhất 1 điểm đến/điểm tận nơi) */
export function isDraftReady(s: BookingState = state): boolean {
  const group = SERVICE_GROUPS[s.service];
  if (!s.sender.place) return false;
  if (group.kind === 'onsite') return true;
  return s.receivers.some(isReceiverComplete);
}

/**
 * id dịch vụ thật trên BE cho option đang chọn. Ném lỗi rõ ràng khi chưa tải catalog hoặc BE chưa mở dịch vụ
 * (thay vì gửi id tạm trong mockBooking rồi nhận 422 "service not found" khó hiểu).
 */
export function requireServiceId(s: BookingState = state): number {
  const opt = getOption(s);
  const id = resolveServiceId(s.service, opt);
  if (!id) throw new Error(`Dịch vụ "${opt.name}" chưa được mở trên hệ thống. Vui lòng chọn dịch vụ khác.`);
  return id;
}

/** Body cho POST /site/deliveryorders & /drymode (theo DeliveryOrders::add / addValidate) */
export function buildOrderPayload(s: BookingState = state, serviceId: number = requireServiceId(s)): Record<string, unknown> {
  const opt = getOption(s);
  const group = SERVICE_GROUPS[s.service];
  const pickup = s.sender.place;
  // Vận tải dùng thang tải trọng riêng (FREIGHT_WEIGHTS) — không tra theo PACKAGE_SIZES của giao hàng nhỏ
  const isTransport = s.service === 'transport';
  // Dọn nhà: không có khái niệm "kích cỡ gói hàng" — cả cuộc dọn nhà tính theo gói xe (đã chọn ở optionId)
  const isRental = s.service === 'rental';
  const sizeList = isTransport ? FREIGHT_WEIGHTS : PACKAGE_SIZES;
  let stops = s.receivers.filter(isReceiverComplete);
  // Dịch vụ tận nơi (gọi thợ): BE bắt buộc có details → dùng chính địa điểm của khách làm điểm đến duy nhất
  if (group.kind === 'onsite' && stops.length === 0 && pickup) {
    stops = [{ ...emptyReceiver(), name: s.sender.name, phone: s.sender.phone, place: pickup, viewOption: 'no_view' }];
  }
  const pickupDate = s.options.scheduledAt ? Math.floor(s.options.scheduledAt / 1000) : 0;
  // Đơn hẹn giờ: BE bắt mỗi điểm giao có giờ giao > giờ lấy - 60' và cách điểm trước ≥ 30'
  // (DeliveryOrderDetail::MAX_MINUTE / GAP_MINUTE_EACH_ITEM) → đặt giờ giao dự kiến tăng dần sau giờ lấy.
  const wayoutDate = (i: number) => (pickupDate > 0 ? pickupDate + 3600 + i * 1800 : 0);
  return {
    service_id: serviceId,
    need_return_pickup: s.options.returnToPickup ? 1 : 0,
    customer_address: pickup?.address ?? '',
    customer_lat: pickup?.lat ?? 0,
    customer_long: pickup?.lng ?? 0,
    pickup_date: pickupDate,
    pickup_location_id: pickup?.savedLocationId ?? 0,
    pickup_fullname: s.sender.name,
    pickup_address: pickup?.address ?? '',
    pickup_phone: s.sender.phone,
    pickup_lat: pickup?.lat ?? 0,
    pickup_long: pickup?.lng ?? 0,
    pickup_map_place_id: pickup?.placeId ?? '',
    payment_method: s.options.paymentMethod === 'wallet' ? 1 : 3, // PAYMENT_METHOD_WALLET=1, CASH=3
    // "Tài xế chỉ định" hiện chọn từ danh sách MẪU (FAVORITE_DRIVERS id 101–104) — gửi lên BE sẽ loại mọi tài xế thật
    // ("Not in Allow List"). Chỉ gửi khi có id tài xế thật (TODO: màn chọn tài xế yêu thích từ BE).
    allow_driver_id_list: [] as number[],
    // Mã khuyến mãi trong app là dữ liệu MẪU; BE từ chối mã không có trong zv-promotion (422 error_coupon_code_invalid)
    // → không gửi cho tới khi có API mã giảm giá thật.
    coupon_code: '',
    price_tip: s.options.tip * EXTRA_PRICES.tip,
    // Thuê nhân công / Dọn nhà / Gọi thợ: BE chưa có field riêng cho thời gian làm việc theo block,
    // số nhân công, tầng lầu/đóng gói/tháo lắp/đồ đặc biệt, hay mô tả sự cố/ảnh hiện trạng → ghi vào
    // note đơn để tài xế/nhân công/thợ biết trước. TODO: chuyển sang field thật khi BE bổ sung.
    note: [
      s.options.note,
      s.service === 'labor' && s.options.laborBlocks > 1 && opt.blockHours
        ? `Thời gian làm việc: ${s.options.laborBlocks} block (${s.options.laborBlocks * opt.blockHours} giờ)`
        : '',
      s.service === 'labor' && s.options.laborWorkers > 1 ? `Số nhân công: ${s.options.laborWorkers}` : '',
      isRental ? movingNote(s) : '',
      s.service === 'handyman' ? handymanNote(s) : '',
    ]
      .filter(Boolean)
      .join(' · '),
    api_metric_place: 1,
    api_metric_distance_matrix_drymode: 1,
    details: stops.map((r, i) => ({
      // Dọn nhà: không có "kích cỡ gói hàng" (cả cuộc dọn nhà tính theo gói xe, không theo từng món đồ)
      weight_id: isRental ? 0 : (sizeList.find((p) => p.id === r.packageSize)?.weightId ?? 0),
      // BE bắt buộc tên + SĐT ở mọi điểm đến (kể cả chở khách/thợ, nơi app không hỏi) → lấy của người đặt
      fullname: r.name.trim() || s.sender.name,
      phone: r.phone.replace(/\D/g, '') || s.sender.phone.replace(/\D/g, ''),
      saved_location_id: r.place?.savedLocationId ?? 0,
      wayout_date_delivered: wayoutDate(i),
      wayout_address: r.place?.address ?? '',
      wayout_lat: r.place?.lat ?? 0,
      wayout_long: r.place?.lng ?? 0,
      wayout_map_place_id: r.place?.placeId ?? '',
      cod: r.cod,
      // Vận tải/Dọn nhà: không có tuỳ chọn "xem hàng" (hàng lớn/cả nhà) → không chèn VIEW_NOTE
      note:
        group.kind === 'delivery' && !isTransport && !isRental
          ? [r.note, VIEW_NOTE[r.viewOption]].filter(Boolean).join(' · ')
          : isTransport && r.needsLoadingHelp
            ? [r.note, 'Cần nhân công bốc xếp'].filter(Boolean).join(' · ')
            : r.note,
      // TODO: id ServiceAddon "Giao hàng tận tay" / "Bốc xếp" chưa rõ → chưa gửi addon, chỉ tính giá phía app
      addons: [] as number[],
      hand_delivery: r.handDelivery ? 1 : 0,
    })),
  };
}

const VIEW_NOTE: Record<ViewOptionId, string> = {
  view: 'Được xem hàng',
  view_check: 'Được xem và kiểm hàng',
  no_view: 'Không được xem hàng',
};

// ---------------------------------------------------------------- Báo giá BE (drymode)
/** Chữ ký các trường ảnh hưởng tới giá — đổi là phải báo giá lại */
function quoteKey(s: BookingState): string {
  const o = s.options;
  return JSON.stringify([
    s.service,
    s.optionId,
    s.sender.place?.lat,
    s.sender.place?.lng,
    s.receivers.filter(isReceiverComplete).map((r) => [r.place?.lat, r.place?.lng, r.cod, r.handDelivery, r.needsLoadingHelp, r.packageSize, r.place?.address]),
    o.returnToPickup,
    o.tip,
    o.promo?.code,
    o.scheduledAt,
    o.paymentMethod,
  ]);
}

let quoteSeq = 0;

/**
 * Gọi POST /site/deliveryorders/drymode để lấy giá BE tính (có km Google Distance Matrix khi server có key).
 * Idempotent theo quoteKey: bản nháp chưa đổi thì không gọi lại. Lỗi được ghi vào quote.error (màn xác nhận hiện).
 */
export async function refreshQuote(force = false): Promise<ServerQuote> {
  const s = state;
  const key = quoteKey(s);
  if (!force && s.quote.key === key && (s.quote.status === 'ready' || s.quote.status === 'loading')) return s.quote;
  if (!isDraftReady(s)) {
    const q = { ...idleQuote(), key };
    update({ quote: q });
    return q;
  }
  const seq = ++quoteSeq;
  update((cur) => ({ quote: { ...cur.quote, status: 'loading', error: null, key } }));
  try {
    await ensureServiceCatalog();
    const res = await orderApi.dryMode(buildOrderPayload(s));
    if (seq !== quoteSeq) return state.quote; // đã có yêu cầu mới hơn
    const detail = (res.price_final_detail ?? {}) as Record<string, unknown>;
    const debug = (res.__debug ?? {}) as Record<string, unknown>;
    const total = num(res.price_final);
    const original = num(detail.price_service) || total;
    const q: ServerQuote = { status: 'ready', total, original: Math.max(original, total), distanceKm: num(debug.p_S), error: null, key };
    update({ quote: q });
    return q;
  } catch (e) {
    if (seq !== quoteSeq) return state.quote;
    const q: ServerQuote = { ...idleQuote(), status: 'error', error: e instanceof Error ? e.message : String(e), key };
    update({ quote: q });
    return q;
  }
}

/** Giá đang có hiệu lực cho bản nháp: giá BE nếu đã báo đúng bản nháp hiện tại, ngược lại ước tính của app */
export function effectivePrice(s: BookingState = state): { total: number; original: number; distanceKm: number; fromServer: boolean } {
  const local = computePrice(s);
  if (s.quote.status === 'ready' && s.quote.key === quoteKey(s)) {
    return { total: s.quote.total, original: s.quote.original, distanceKm: s.quote.distanceKm || local.distanceKm, fromServer: true };
  }
  return { total: local.total, original: local.subtotal, distanceKm: local.distanceKm, fromServer: false };
}

// ---------------------------------------------------------------- Đơn theo dõi (mock + snapshot)
export const isMockOrderId = (id: string) => id.startsWith('mock-');

function codeFromId(id: string): string {
  if (isMockOrderId(id)) return id.slice(-6).toUpperCase();
  return id;
}

/** Dựng TrackedOrder từ bản nháp hiện tại */
export function trackedFromDraft(id: string, s: BookingState = state, price: PriceSummary = computePrice(s), isMock = true): TrackedOrder {
  const opt = getOption(s);
  const pickup = s.sender.place ?? placeFromSample(DEFAULT_SENDER_PLACE, 'default');
  const stops = s.receivers.filter(isReceiverComplete);
  return {
    id,
    code: `#${codeFromId(id)}`,
    status: s.options.scheduledAt ? 2 /* STATUS_NEW_SCHEDULED */ : ORDER_STATUS.ASSIGNING,
    service: s.service,
    optionId: opt.id,
    serviceName: opt.name,
    serviceDescription: opt.description,
    scheduledAt: s.options.scheduledAt,
    returnAt: s.options.returnAt,
    waitForReturn: s.options.waitForReturn,
    distanceKm: price.distanceKm,
    promoLabel: promoLabel(s.options.promo),
    paymentMethod: s.options.paymentMethod,
    note: s.options.note,
    pickup: { name: s.sender.name, phone: s.sender.phone, address: pickup.address, lat: pickup.lat, lng: pickup.lng, status: 'picking' },
    stops: stops.map((r) => ({ name: r.name, phone: r.phone, address: r.place!.address, lat: r.place!.lat, lng: r.place!.lng, status: 'new' })),
    driver: null,
    total: price.total,
    original: price.subtotal,
    etaMinutes: 10,
    createdAt: Date.now(),
    isMock,
  };
}

export function rememberOrder(order: TrackedOrder) {
  update((s) => ({ orders: { ...s.orders, [order.id]: order } }));
  return order;
}
export const getStoredOrder = (id: string): TrackedOrder | null => state.orders[id] ?? null;

export function updateStoredOrder(id: string, patch: Partial<TrackedOrder>): TrackedOrder | null {
  const cur = state.orders[id];
  if (!cur) return null;
  const next = { ...cur, ...patch };
  update((s) => ({ orders: { ...s.orders, [id]: next } }));
  return next;
}

export function cancelStoredOrder(id: string) {
  updateStoredOrder(id, { status: ORDER_STATUS.CUSTOMER_CANCELLED });
}

/** Đơn demo khi mở /booking/tracking không có orderId (hoặc để QA trạng thái) */
export function createDemoOrder(id: string, variant?: string): TrackedOrder {
  const hasDraft = state.receivers.some(isReceiverComplete) && state.sender.name;
  const s: BookingState = hasDraft
    ? state
    : {
        ...state,
        sender: { name: state.sender.name || 'Phan Thanh Tùng', phone: state.sender.phone || '0352237832', place: state.sender.place ?? placeFromSample(DEFAULT_SENDER_PLACE, 'default') },
        receivers: [
          { ...emptyReceiver(), name: 'Tú Quỳnh', phone: '0352237833', place: placeFromSample(SAMPLE_PLACES[2]!) },
          { ...emptyReceiver(), name: 'Nguyễn Văn A', phone: '0909000111', place: placeFromSample(SAMPLE_PLACES[3]!), cod: 250000 },
        ],
        options: { ...defaultOptions(), note: 'Hàng cần giao cẩn thận', promo: { code: 'MUAXUAN2020', title: 'Mã MUAXUAN2020', description: '', percent: 20 } },
      };
  const order = trackedFromDraft(id, s, computePrice(s), true);
  if (variant === 'scheduled') {
    order.scheduledAt = Date.now() + 2 * 3600 * 1000;
    order.status = 2;
  }
  return rememberOrder(order);
}

const pickDriver = (o: TrackedOrder, s: BookingState = state): DriverDef => {
  const wanted = s.options.assignedDrivers;
  return FAVORITE_DRIVERS.find((d) => wanted.includes(d.id)) ?? o.driver ?? MOCK_DRIVER;
};

/** Tiến 1 bước trạng thái đơn mock: tìm tài xế → nhận → đến nơi → lấy hàng → giao từng điểm → hoàn thành */
export function advanceMockOrder(id: string): TrackedOrder | null {
  const o = state.orders[id];
  if (!o) return null;
  const S = ORDER_STATUS;
  let patch: Partial<TrackedOrder>;
  switch (o.status) {
    case 2:
    case S.NEW:
      patch = { status: S.ASSIGNING };
      break;
    case S.ASSIGNING:
      patch = { status: S.ACCEPTED, driver: pickDriver(o), etaMinutes: 10 };
      break;
    case S.ACCEPTED:
      patch = { status: S.BOARDED, etaMinutes: 3 };
      break;
    case S.BOARDED:
      patch = { status: S.PICKED, pickup: { ...o.pickup, status: 'picked' }, stops: o.stops.map((st) => ({ ...st, status: 'delivering' as StopStatus })) };
      break;
    case S.PICKED:
    case S.STARTED:
      patch = { status: S.DELIVERING };
      break;
    case S.DELIVERING: {
      const idx = o.stops.findIndex((st) => st.status !== 'completed');
      if (idx === -1) {
        patch = { status: S.COMPLETED };
      } else {
        const stops = o.stops.map((st, i) => (i === idx ? { ...st, status: 'completed' as StopStatus } : st));
        patch = { stops, status: stops.every((st) => st.status === 'completed') ? S.COMPLETED : S.DELIVERING };
      }
      break;
    }
    default:
      return o; // trạng thái kết thúc
  }
  return updateStoredOrder(id, patch);
}

export const isTerminalStatus = (status: number) => status >= ORDER_STATUS.COMPLETED;

export function getTrackingPhase(o: TrackedOrder): TrackedPhase {
  const S = ORDER_STATUS;
  const s = o.status;
  if (s === S.COMPLETED) return 'completed';
  if (s === S.FAIL) return 'notfound';
  if (s >= S.CUSTOMER_CANCELLED) return 'cancelled';
  if (s >= S.PICKED) return 'delivering';
  if (s >= S.ACCEPTED || o.driver) return 'accepted';
  if (s === S.NEW_SCHEDULED || (o.scheduledAt && s < S.ASSIGNING)) return 'scheduled';
  if (o.searchExpired) return 'notfound';
  return 'searching';
}
type TrackedPhase = TrackingPhase;

/**
 * Đồng bộ trạng thái đợt tìm tài xế của đơn thật từ GET /site/deliveryorderprocesses/last.
 * Hết hạn = đợt gần nhất đã xong (COMPLETED/CANCELLED) hoặc kẹt (QUEUED/SCANNING quá date_expired — queue/worker chết),
 * hoặc đơn còn NEW mà chưa có đợt nào (bước bắt đầu tìm đã lỗi) → màn theo dõi hiện "Không tìm thấy" + nút thử lại.
 */
export async function syncSearchState(orderId: string): Promise<void> {
  const cur = state.orders[orderId];
  if (!cur || cur.driver || (cur.status !== ORDER_STATUS.ASSIGNING && cur.status !== ORDER_STATUS.NEW)) return;
  try {
    const res = await orderApi.getLastProcess(orderId);
    const last = res.items?.[0];
    const now = Math.floor(Date.now() / 1000);
    let expired: boolean;
    if (!last) {
      expired = cur.status === ORDER_STATUS.NEW && !cur.scheduledAt;
    } else {
      const st = Number(last.status);
      const dateExpired = Number(last.date_expired);
      const finished = st === PROCESS_STATUS.COMPLETED || st === PROCESS_STATUS.CANCELLED;
      // QUEUED/SCANNING quá hạn thêm 60s = worker không chạy → coi như không tìm thấy
      const stuck = !finished && dateExpired > 0 && dateExpired + 60 < now;
      expired = (finished && dateExpired > 0 && dateExpired < now) || stuck;
    }
    if (expired !== !!cur.searchExpired) updateStoredOrder(orderId, { searchExpired: expired });
  } catch {
    /* giữ trạng thái cũ */
  }
}

// ---------------------------------------------------------------- Chuẩn hoá đơn từ API
const num = (v: unknown): number => (typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) || 0 : 0);
const str = (v: unknown): string => (v == null ? '' : String(v));

function detailStatus(detail: number, orderStatus: number): StopStatus {
  // DeliveryOrderDetail: NEW=1, COMPLETED=3, FAILED=5, RETURNED=7
  if (detail === 3) return 'completed';
  if (detail === 5) return 'failed';
  if (detail === 7) return 'returned';
  if (orderStatus >= ORDER_STATUS.COMPLETED) return 'completed';
  if (orderStatus >= ORDER_STATUS.PICKED) return 'delivering';
  return 'new';
}

/** Tài xế từ JSON đơn (enrichOrderData: driver{full_name, phone, avatar_url, rating} + driver_account_id) */
function driverFromApi(o: DeliveryOrder, base?: TrackedOrder | null): DriverDef | null {
  const driverId = num(o.driver_account_id);
  if (driverId <= 0) return null;
  const d = (o.driver ?? {}) as Record<string, unknown>;
  const name = str(d.full_name).trim();
  const keepBase = base?.driver && base.driver.id === driverId ? base.driver : null;
  return {
    id: driverId,
    name: name || keepBase?.name || 'Tài xế ZuumViet',
    phone: str(d.phone) || keepBase?.phone || '',
    avatar: str(d.avatar_url) || keepBase?.avatar || undefined,
    rating: num(d.rating) || keepBase?.rating || 0,
    reviews: keepBase?.reviews ?? 0,
    plate: keepBase?.plate ?? '',
    vehicle: keepBase?.vehicle ?? '',
  };
}

/** Gộp dữ liệu API (getJsonDataForApp + enrichOrderData) lên snapshot đã có để đủ tên/địa chỉ hiển thị */
export function normalizeApiOrder(o: DeliveryOrder, base?: TrackedOrder | null): TrackedOrder {
  const id = String(o.id);
  const status = num(o.status) || base?.status || ORDER_STATUS.ASSIGNING;
  const pickupDate = num(o.pickup_date);
  // total_distance BE luôn lưu bằng mét
  const distanceKm = Math.round(num(o.total_distance) / 100) / 10;
  const details = Array.isArray(o.details) ? (o.details as Record<string, unknown>[]) : null;
  const stops: TrackedStop[] =
    details && details.length
      ? details.map((d, i) => ({
          name: str(d.full_name) || base?.stops[i]?.name || `Điểm giao ${i + 1}`,
          phone: str(d.phone) || base?.stops[i]?.phone || '',
          address: str(d.wayout_address) || base?.stops[i]?.address || '',
          lat: num(d.wayout_lat) || base?.stops[i]?.lat || HCM_CENTER.lat,
          lng: num(d.wayout_long) || base?.stops[i]?.lng || HCM_CENTER.lng,
          status: detailStatus(num(d.status), status),
        }))
      : (base?.stops ?? []).map((st) => ({ ...st, status: detailStatus(0, status) === 'new' ? st.status : detailStatus(0, status) }));
  const coupon = str(o.coupon_code);
  const discount = num(o.coupon_discount_value);
  const total = num(o.price_final) || base?.total || 0;
  // Nhóm/option từ service_id thật (catalog đã tải) — không có thì giữ snapshot, cuối cùng mới mặc định Giao hàng
  const mapped = findOptionByServiceId(num(o.service_id));
  const serviceName = mapped?.option.name ?? base?.serviceName ?? serviceNameById(num(o.service_id)) ?? 'Giao hàng';
  return {
    id,
    code: `#${id}`,
    status,
    service: mapped?.service ?? base?.service ?? 'delivery',
    optionId: mapped?.option.id ?? base?.optionId ?? '',
    serviceName,
    serviceDescription: mapped?.option.description ?? base?.serviceDescription ?? '',
    scheduledAt: pickupDate > 0 ? pickupDate * 1000 : null,
    returnAt: base?.returnAt ?? null,
    waitForReturn: base?.waitForReturn ?? true,
    distanceKm: distanceKm || base?.distanceKm || 0,
    promoLabel: coupon ? (discount > 0 && discount <= 100 ? `Giảm ${discount}%` : `Mã ${coupon}`) : (base?.promoLabel ?? null),
    // PAYMENT_METHOD_WALLET = 1, CASH = 3
    paymentMethod: num(o.payment_method) === 1 ? 'wallet' : 'cash',
    note: str(o.note) || base?.note || '',
    pickup: {
      name: str(o.pickup_fullname) || base?.pickup.name || '',
      phone: str(o.pickup_phone) || base?.pickup.phone || '',
      address: str(o.pickup_address) || base?.pickup.address || '',
      lat: num(o.pickup_lat) || base?.pickup.lat || HCM_CENTER.lat,
      lng: num(o.pickup_long) || base?.pickup.lng || HCM_CENTER.lng,
      status: status >= ORDER_STATUS.PICKED ? 'picked' : 'picking',
    },
    stops,
    driver: driverFromApi(o, base),
    total,
    original: base?.original && base.original >= total ? base.original : total,
    etaMinutes: base?.etaMinutes ?? 10,
    createdAt: num(o.date_created) ? num(o.date_created) * 1000 : (base?.createdAt ?? Date.now()),
    isMock: false,
  };
}

// ---------------------------------------------------------------- Tạo đơn
export interface SubmitResult {
  orderId: string;
  mock: boolean;
  /** lỗi phụ (vd không khởi động được tìm tài xế) — đơn vẫn đã tạo */
  error: string | null;
}

/**
 * Tạo đơn thật: POST /site/deliveryorders → POST /site/deliveryorderprocesses/{id} (bắt đầu tìm tài xế;
 * đơn hẹn giờ thì cron của BE tự mở process khi tới giờ). Mọi lỗi tạo đơn được ném ra cho màn xác nhận hiển thị.
 */
export async function submitBooking(): Promise<SubmitResult> {
  const s = state;
  await ensureServiceCatalog();
  const payload = buildOrderPayload(s);
  const price = computePrice(s);
  const created = await orderApi.createOrder(payload);
  if (!created || typeof created.id !== 'number' || created.id <= 0) {
    throw new Error('Phản hồi tạo đơn không hợp lệ');
  }
  const id = String(created.id);
  const snapshot = trackedFromDraft(id, s, price, false);
  rememberOrder(normalizeApiOrder(created, snapshot));
  resetDraft();

  let error: string | null = null;
  if (!s.options.scheduledAt) {
    try {
      await orderApi.startDriverSearch(id);
      updateStoredOrder(id, { status: ORDER_STATUS.ASSIGNING });
    } catch (e) {
      // Đơn đã tạo nhưng chưa bắt đầu tìm được tài xế (vd BE: error_scanning_process_not_expired khi đang có đợt quét khác)
      // → đánh dấu để màn theo dõi hiện "Không tìm thấy tài xế" + nút "Thử lại" thay vì quay vòng "Đang tìm" mãi
      error = e instanceof Error ? e.message : String(e);
      updateStoredOrder(id, { searchExpired: true });
    }
  }
  return { orderId: id, mock: false, error };
}

/** Tìm lại tài xế cho đơn thật (nút "Thử lại" ở màn theo dõi khi không tìm thấy tài xế) */
export async function retrySearch(orderId: string): Promise<void> {
  await orderApi.startDriverSearch(orderId);
  updateStoredOrder(orderId, { status: ORDER_STATUS.ASSIGNING, driver: null });
}

/**
 * "Chọn tài xế trực tiếp": khách đã gặp tài xế ngoài đời và quét mã QR của họ để đặt chuyến ngay,
 * bỏ qua bước tìm/ghép tài xế. Chưa có API cho luồng này ở BE → tạo thẳng đơn mock ở trạng thái "đã nhận".
 */
export function submitBookingWithDriver(driver: DriverDef): SubmitResult {
  const s = state;
  const price = computePrice(s);
  const order = trackedFromDraft(`mock-${uid()}`, s, price, true);
  order.driver = driver;
  order.status = ORDER_STATUS.ACCEPTED;
  order.etaMinutes = 5;
  rememberOrder(order);
  resetDraft();
  return { orderId: order.id, mock: true, error: null };
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
