// services/bookingStore.ts — store nhỏ trong bộ nhớ cho luồng đặt hàng (module state + useSyncExternalStore).
// Giữ bản nháp đơn giữa các bước: chọn dịch vụ → người gửi → người nhận → xác nhận → theo dõi.
// - buildOrderPayload(): dựng body cho orderApi.createOrder theo Controller\Site\DeliveryOrders::add (zv-delivery)
// - submitBooking(): drymode → createOrder; BE từ chối → tạo đơn MOCK để màn theo dõi vẫn demo được.
import { useSyncExternalStore } from 'react';
import { orderApi, ORDER_STATUS, getStoredCustomer, type DeliveryOrder } from '@/services/api';
import {
  SERVICE_GROUPS,
  EXTRA_PRICES,
  DEFAULT_SENDER_PLACE,
  MOCK_DRIVER,
  FAVORITE_DRIVERS,
  PACKAGE_SIZES,
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
}

export type PaymentMethod = 'cash' | 'wallet';

export interface BookingOptions {
  returnToPickup: boolean;
  handToCustomer: number;
  tip: number;
  /** epoch ms; null = "Bây giờ" */
  scheduledAt: number | null;
  assignedDrivers: number[];
  note: string;
  promo: PromoDef | null;
  paymentMethod: PaymentMethod;
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
}

export interface BookingState {
  service: ServiceKey;
  optionId: string;
  sender: Sender;
  receivers: Receiver[];
  options: BookingOptions;
  /** đơn mock + snapshot đơn thật vừa tạo (key = orderId) */
  orders: Record<string, TrackedOrder>;
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
  assignedDrivers: [],
  note: '',
  promo: null,
  paymentMethod: 'cash',
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
});

const firstOptionId = (service: ServiceKey) => SERVICE_GROUPS[service].options[0]!.id;

function createInitialState(service: ServiceKey): BookingState {
  return {
    service,
    optionId: firstOptionId(service),
    sender: { name: '', phone: '', place: placeFromSample(DEFAULT_SENDER_PLACE, 'default') },
    receivers: [],
    options: defaultOptions(),
    orders: {},
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
  update({ receivers: [], options: defaultOptions() });
}

// ---------------------------------------------------------------- Giá & khoảng cách
export function getOption(s: BookingState = state, optionId?: string): ServiceOptionDef {
  const opts = SERVICE_GROUPS[s.service].options;
  return opts.find((o) => o.id === (optionId ?? s.optionId)) ?? opts[0]!;
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
  const distanceKm = routeDistanceKm(s);
  const stops = s.receivers.filter(isReceiverComplete);
  const extraKm = Math.max(0, Math.ceil(distanceKm) - opt.includedKm);
  const extraStops = Math.max(0, stops.length - 1);
  const base = opt.basePrice + extraKm * opt.perKmPrice + extraStops * opt.extraStopPrice;

  const lines: PriceLine[] = [{ label: SERVICE_GROUPS[s.service].labels.feeLabel, amount: base }];
  const handDelivery = stops.filter((r) => r.handDelivery).length * EXTRA_PRICES.handDelivery;
  if (handDelivery) lines.push({ label: 'Giao hàng tận tay', amount: handDelivery });
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

// ---------------------------------------------------------------- Payload BE
/** Body cho POST /site/deliveryorders & /drymode (theo DeliveryOrders::add / addValidate) */
export function buildOrderPayload(s: BookingState = state): Record<string, unknown> {
  const opt = getOption(s);
  const group = SERVICE_GROUPS[s.service];
  const pickup = s.sender.place;
  let stops = s.receivers.filter(isReceiverComplete);
  // Dịch vụ tận nơi (gọi thợ): BE bắt buộc có details → dùng chính địa điểm của khách làm điểm đến duy nhất
  if (group.kind === 'onsite' && stops.length === 0 && pickup) {
    stops = [{ ...emptyReceiver(), name: s.sender.name, phone: s.sender.phone, place: pickup, viewOption: 'no_view' }];
  }
  return {
    service_id: opt.serviceId,
    need_return_pickup: s.options.returnToPickup ? 1 : 0,
    customer_address: pickup?.address ?? '',
    customer_lat: pickup?.lat ?? 0,
    customer_long: pickup?.lng ?? 0,
    pickup_date: s.options.scheduledAt ? Math.floor(s.options.scheduledAt / 1000) : 0,
    pickup_location_id: pickup?.savedLocationId ?? 0,
    pickup_fullname: s.sender.name,
    pickup_address: pickup?.address ?? '',
    pickup_phone: s.sender.phone,
    pickup_lat: pickup?.lat ?? 0,
    pickup_long: pickup?.lng ?? 0,
    pickup_map_place_id: pickup?.placeId ?? '',
    payment_method: s.options.paymentMethod === 'wallet' ? 1 : 3, // PAYMENT_METHOD_WALLET=1, CASH=3
    allow_driver_id_list: s.options.assignedDrivers,
    coupon_code: s.options.promo?.code ?? '',
    price_tip: s.options.tip * EXTRA_PRICES.tip,
    note: s.options.note,
    api_metric_place: 1,
    api_metric_distance_matrix_drymode: 1,
    details: stops.map((r) => ({
      weight_id: PACKAGE_SIZES.find((p) => p.id === r.packageSize)?.weightId ?? 0,
      fullname: r.name,
      phone: r.phone,
      saved_location_id: r.place?.savedLocationId ?? 0,
      wayout_date_delivered: 0,
      wayout_address: r.place?.address ?? '',
      wayout_lat: r.place?.lat ?? 0,
      wayout_long: r.place?.lng ?? 0,
      wayout_map_place_id: r.place?.placeId ?? '',
      cod: r.cod,
      note: group.kind === 'delivery' ? [r.note, VIEW_NOTE[r.viewOption]].filter(Boolean).join(' · ') : r.note,
      // TODO: id ServiceAddon "Giao hàng tận tay" chưa rõ → chưa gửi addon, chỉ tính giá phía app
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

export function getTrackingPhase(o: TrackedOrder): TrackingPhase {
  const S = ORDER_STATUS;
  const s = o.status;
  if (s === S.COMPLETED) return 'completed';
  if (s === S.FAIL) return 'notfound';
  if (s >= S.CUSTOMER_CANCELLED) return 'cancelled';
  if (s >= S.PICKED) return 'delivering';
  if (s >= S.ACCEPTED) return 'accepted';
  if (s === 2 || (o.scheduledAt && s < S.ASSIGNING)) return 'scheduled';
  return 'searching';
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

/** Gộp dữ liệu API (getJsonDataForApp) lên snapshot đã có để đủ tên/địa chỉ hiển thị */
export function normalizeApiOrder(o: DeliveryOrder, base?: TrackedOrder | null): TrackedOrder {
  const id = String(o.id);
  const status = num(o.status) || base?.status || ORDER_STATUS.ASSIGNING;
  const pickupDate = num(o.pickup_date);
  const rawDistance = num(o.total_distance);
  const distanceKm = rawDistance > 500 ? Math.round(rawDistance / 100) / 10 : rawDistance;
  const details = Array.isArray(o.details) ? (o.details as Record<string, unknown>[]) : null;
  const stops: TrackedStop[] =
    details && details.length
      ? details.map((d, i) => ({
          name: str(d.fullname) || base?.stops[i]?.name || `Điểm giao ${i + 1}`,
          phone: str(d.phone) || base?.stops[i]?.phone || '',
          address: str(d.wayout_address) || base?.stops[i]?.address || '',
          lat: num(d.wayout_lat) || base?.stops[i]?.lat || HCM_CENTER.lat,
          lng: num(d.wayout_long) || base?.stops[i]?.lng || HCM_CENTER.lng,
          status: detailStatus(num(d.status), status),
        }))
      : (base?.stops ?? []).map((st) => ({ ...st, status: detailStatus(0, status) === 'new' ? st.status : detailStatus(0, status) }));
  const coupon = str(o.coupon_code);
  const discount = num(o.coupon_discount_value);
  const active = status >= ORDER_STATUS.ACCEPTED && status < ORDER_STATUS.FAIL;
  const total = num(o.price_final) || base?.total || 0;
  return {
    id,
    code: `#${str(o.invoiceid) || id}`,
    status,
    service: base?.service ?? 'delivery',
    optionId: base?.optionId ?? '',
    serviceName: base?.serviceName ?? 'Giao hàng',
    serviceDescription: base?.serviceDescription ?? '',
    scheduledAt: pickupDate > 0 ? pickupDate * 1000 : null,
    distanceKm: distanceKm || base?.distanceKm || 0,
    promoLabel: coupon ? (discount > 0 && discount <= 100 ? `Giảm ${discount}%` : `Mã ${coupon}`) : (base?.promoLabel ?? null),
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
    // BE chỉ trả driver_account_id → dùng tài xế mock để hiển thị (TODO: gọi API hồ sơ tài xế)
    driver: active || status === ORDER_STATUS.COMPLETED ? (base?.driver ?? MOCK_DRIVER) : (base?.driver ?? null),
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
  /** thông điệp lỗi API khi phải rơi về mock */
  error: string | null;
}

export async function submitBooking(): Promise<SubmitResult> {
  const s = state;
  const payload = buildOrderPayload(s);
  const price = computePrice(s);
  let apiError: string | null = null;
  try {
    // Giữ bước drymode như màn map cũ (BE tính giá/khoảng cách); lỗi drymode không chặn luồng
    await orderApi.dryMode(payload).catch(() => null);
    const created = await orderApi.createOrder(payload);
    if (created && typeof created.id === 'number' && created.id > 0) {
      const id = String(created.id);
      rememberOrder(normalizeApiOrder(created, trackedFromDraft(id, s, price, false)));
      resetDraft();
      return { orderId: id, mock: false, error: null };
    }
    throw new Error('Phản hồi tạo đơn không hợp lệ');
  } catch (e) {
    apiError = e instanceof Error ? e.message : String(e);
  }
  // Fallback: đơn MOCK để demo màn theo dõi
  const mock = rememberOrder(trackedFromDraft(`mock-${uid()}`, s, price, true));
  resetDraft();
  return { orderId: mock.id, mock: true, error: apiError };
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
