// store — tiny module-state store + hook (useSyncExternalStore), không cần thư viện ngoài.
// Dùng cho state mock chia sẻ giữa các màn (hộp thư, vị trí đã lưu, tài xế yêu thích, cộng đồng).
import { useSyncExternalStore } from 'react';

export type Store<T> = {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
  /** hook đọc state (re-render khi thay đổi) */
  use: () => T;
};

export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();

  const get = () => state;
  const set: Store<T>['set'] = (next) => {
    const value = typeof next === 'function' ? (next as (prev: T) => T)(state) : next;
    if (value === state) return;
    state = value;
    listeners.forEach((l) => l());
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  };
  const use = () => useSyncExternalStore(subscribe, get, get);

  return { get, set, subscribe, use };
}
