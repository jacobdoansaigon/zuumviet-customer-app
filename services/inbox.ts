// services/inbox.ts — Hộp thư của khách: GET /v1/customer/notifications (phân trang) + unread-count, đánh dấu đã đọc
// (1 / tất cả), xoá (1 / tất cả). Badge tab Hộp thư = `unread` server trả về sau mỗi thao tác; có thông báo mới
// (realtime notification.new) → tải lại số chưa đọc và trang đầu nếu đang xem.
import { createStore } from '@/services/store';
import { onRealtime } from '@/services/realtime';
import { api, onSessionChange, type ZuumResponse } from '@/services/zuum';

export type InboxItem = ZuumResponse<'GET /v1/customer/notifications'>['items'][number];
export type InboxType = InboxItem['type'];

interface InboxState {
  /** null = chưa tải danh sách */
  items: InboxItem[] | null;
  total: number;
  page: number;
  unread: number;
}

const PAGE_SIZE = 20;
const initial: InboxState = { items: null, total: 0, page: 0, unread: 0 };
const store = createStore<InboxState>(initial);

export function useInbox(): InboxState {
  return store.use();
}

export function useUnreadCount(): number {
  return store.use().unread;
}

/** Tải trang đầu (thay danh sách) */
export async function loadInbox(): Promise<void> {
  const res = await api('GET /v1/customer/notifications', { query: { page: 1, pageSize: PAGE_SIZE } });
  store.set({ items: res.items, total: res.total, page: 1, unread: res.unread });
}

/** Tải thêm trang kế */
export async function loadMoreInbox(): Promise<void> {
  const s = store.get();
  if (!s.items || s.items.length >= s.total) return;
  const res = await api('GET /v1/customer/notifications', { query: { page: s.page + 1, pageSize: PAGE_SIZE } });
  store.set((cur) => ({
    items: [...(cur.items ?? []), ...res.items.filter((n) => !(cur.items ?? []).some((m) => m.id === n.id))],
    total: res.total,
    page: res.page,
    unread: res.unread,
  }));
}

export async function refreshUnread(): Promise<void> {
  const res = await api('GET /v1/customer/notifications/unread-count');
  store.set((cur) => ({ ...cur, unread: res.unread }));
}

export async function markRead(id: string): Promise<void> {
  const item = store.get().items?.find((n) => n.id === id);
  if (item?.readAt) return;
  const res = await api('POST /v1/customer/notifications/:id/read', { params: { id } });
  const now = new Date().toISOString();
  store.set((cur) => ({ ...cur, unread: res.unread, items: cur.items?.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? now } : n)) ?? null }));
}

export async function markAllRead(): Promise<void> {
  const res = await api('POST /v1/customer/notifications/read-all');
  const now = new Date().toISOString();
  store.set((cur) => ({ ...cur, unread: res.unread, items: cur.items?.map((n) => ({ ...n, readAt: n.readAt ?? now })) ?? null }));
}

export async function removeNotification(id: string): Promise<void> {
  const res = await api('DELETE /v1/customer/notifications/:id', { params: { id } });
  store.set((cur) => ({ ...cur, unread: res.unread, total: Math.max(0, cur.total - 1), items: cur.items?.filter((n) => n.id !== id) ?? null }));
}

export async function clearInbox(): Promise<void> {
  const res = await api('DELETE /v1/customer/notifications');
  store.set({ items: [], total: 0, page: 1, unread: res.unread });
}

export function getInboxItem(id: string): InboxItem | null {
  return store.get().items?.find((n) => n.id === id) ?? null;
}

/** Đích điều hướng từ `data` của thông báo (orderId / bookingId / screen) */
export interface InboxTarget {
  orderId: string | null;
  bookingId: string | null;
  screen: string | null;
}

export function inboxTarget(item: Pick<InboxItem, 'data'>): InboxTarget {
  const d = item.data && typeof item.data === 'object' ? (item.data as Record<string, unknown>) : {};
  const s = (v: unknown) => (typeof v === 'string' && v ? v : null);
  return { orderId: s(d.orderId), bookingId: s(d.bookingId), screen: s(d.screen) };
}

onRealtime('notification.new', () => {
  const loaded = store.get().items !== null;
  void (loaded ? loadInbox() : refreshUnread()).catch(() => undefined);
});
onRealtime('ready', () => {
  void refreshUnread().catch(() => undefined);
});
onSessionChange((event) => {
  if (event !== 'login') store.set(initial);
});
