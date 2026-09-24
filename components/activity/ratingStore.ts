// Lưu đánh giá tài xế cục bộ (chưa có API rating) — dùng useSyncExternalStore để màn khác cập nhật theo
import { useSyncExternalStore } from 'react';
import type { ActivityOrder, ActivityRating } from '@/constants/mockOrders';

type Listener = () => void;

const ratings = new Map<string, ActivityRating>();
const listeners = new Set<Listener>();
let version = 0;

function emit() {
  version += 1;
  listeners.forEach((l) => l());
}

export function subscribeRatings(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getVersion = () => version;

/** Tăng khi có đánh giá mới → dùng làm dependency để tính lại danh sách */
export function useRatingsVersion() {
  return useSyncExternalStore(subscribeRatings, getVersion, getVersion);
}

export function getLocalRating(orderId: string) {
  return ratings.get(orderId);
}

export function setLocalRating(orderId: string, rating: ActivityRating) {
  ratings.set(orderId, rating);
  emit();
}

export function updateLocalRating(order: ActivityOrder, patch: Partial<ActivityRating>) {
  const current: ActivityRating = ratings.get(order.id) ??
    order.rating ?? { stars: 0, tags: [], favorite: false, blocked: false };
  setLocalRating(order.id, { ...current, ...patch });
}

/** Trộn đánh giá cục bộ (nếu có) vào order */
export function withLocalRating(order: ActivityOrder): ActivityOrder {
  const local = ratings.get(order.id);
  return local ? { ...order, rating: local } : order;
}
