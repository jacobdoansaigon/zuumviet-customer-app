// inboxStore — state Hộp thư (mock): đọc / xoá / đếm chưa đọc (badge tab)
import { MOCK_INBOX, type InboxItem } from '@/constants/mock';
import { createStore } from './store';

export const inboxStore = createStore<InboxItem[]>(MOCK_INBOX);

export const inboxActions = {
  markRead(id: string) {
    inboxStore.set((items) => items.map((m) => (m.id === id && !m.read ? { ...m, read: true } : m)));
  },
  remove(id: string) {
    inboxStore.set((items) => items.filter((m) => m.id !== id));
  },
  clearAll() {
    inboxStore.set([]);
  },
  /** khôi phục dữ liệu mock (dùng cho demo sau khi xoá hết) */
  reset() {
    inboxStore.set(MOCK_INBOX);
  },
};

export function useInbox() {
  return inboxStore.use();
}

export function useUnreadCount() {
  const items = inboxStore.use();
  return items.filter((m) => !m.read).length;
}

export function findInboxItem(id: string): InboxItem | undefined {
  return inboxStore.get().find((m) => m.id === id);
}
