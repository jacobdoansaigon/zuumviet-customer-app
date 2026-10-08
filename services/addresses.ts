// services/addresses.ts — "Vị trí đã lưu" của khách: GET/POST/PATCH/DELETE /v1/customer/addresses
// (kind home | work | other, tối đa 20, mỗi loại Nhà / Công ty chỉ 1). Store dùng chung cho màn chọn địa điểm,
// Vị trí đã lưu và badge ở tab Hồ sơ.
import { createStore } from '@/services/store';
import { api, onSessionChange, type ZuumResponse, type ZuumRoutes } from '@/services/zuum';

export type SavedAddress = ZuumResponse<'GET /v1/customer/addresses'>[number];
export type SavedAddressKind = SavedAddress['kind'];
export type SavedAddressInput = ZuumRoutes['POST /v1/customer/addresses']['body'];

const store = createStore<SavedAddress[] | null>(null);

export function useSavedAddresses(): SavedAddress[] | null {
  return store.use();
}

export async function loadSavedAddresses(): Promise<SavedAddress[]> {
  const list = await api('GET /v1/customer/addresses');
  store.set(list);
  return list;
}

export async function createSavedAddress(input: SavedAddressInput): Promise<SavedAddress> {
  const created = await api('POST /v1/customer/addresses', { body: input });
  store.set((list) => [...(list ?? []).filter((a) => a.id !== created.id), created]);
  return created;
}

export async function updateSavedAddress(id: string, patch: ZuumRoutes['PATCH /v1/customer/addresses/:id']['body']): Promise<SavedAddress> {
  const updated = await api('PATCH /v1/customer/addresses/:id', { params: { id }, body: patch });
  store.set((list) => (list ?? []).map((a) => (a.id === id ? updated : a)));
  return updated;
}

export async function deleteSavedAddress(id: string): Promise<void> {
  await api('DELETE /v1/customer/addresses/:id', { params: { id } });
  store.set((list) => (list ?? []).filter((a) => a.id !== id));
}

export function clearSavedAddresses() {
  store.set(null);
}

export const SAVED_KIND_LABEL: Record<SavedAddressKind, string> = { home: 'Nhà', work: 'Công ty', other: 'Khác' };

// đăng xuất / hết phiên: xoá danh sách của người trước
onSessionChange((event) => {
  if (event !== 'login') store.set(null);
});
