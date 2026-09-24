// profileStore — state mock cho Hồ sơ: vị trí đã lưu, tài xế yêu thích, avatar cục bộ
import {
  MOCK_FAVORITE_DRIVERS,
  MOCK_SAVED_LOCATIONS,
  type FavoriteDriverGroup,
  type SavedLocation,
} from '@/constants/mock';
import { createStore } from './store';

/* Vị trí đã lưu */
export const savedLocationsStore = createStore<SavedLocation[]>(MOCK_SAVED_LOCATIONS);

export const savedLocationActions = {
  add(loc: Omit<SavedLocation, 'id'> & { id?: string }) {
    const id = loc.id ?? `loc_${Date.now()}`;
    savedLocationsStore.set((list) => {
      const exists = list.some((l) => l.id === id);
      const item: SavedLocation = { ...loc, id };
      return exists ? list.map((l) => (l.id === id ? item : l)) : [...list, item];
    });
    return id;
  },
  remove(id: string) {
    savedLocationsStore.set((list) => list.filter((l) => l.id !== id));
  },
};

export function useSavedLocations() {
  return savedLocationsStore.use();
}

/* Tài xế yêu thích */
export const favoriteDriversStore = createStore<FavoriteDriverGroup[]>(MOCK_FAVORITE_DRIVERS);

export const favoriteDriverActions = {
  remove(driverId: string) {
    favoriteDriversStore.set((groups) =>
      groups
        .map((g) => ({ ...g, drivers: g.drivers.filter((d) => d.id !== driverId) }))
        .filter((g) => g.drivers.length > 0)
    );
  },
};

export function useFavoriteDrivers() {
  return favoriteDriversStore.use();
}

export function countFavoriteDrivers(groups: FavoriteDriverGroup[]) {
  return groups.reduce((n, g) => n + g.drivers.length, 0);
}

/* Avatar chọn từ máy (chưa upload BE) */
export const localAvatarStore = createStore<string | null>(null);
