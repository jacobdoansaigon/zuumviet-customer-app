// useCurrentLocation — lấy GPS 1 lần trên native; web KHÔNG xin quyền (dùng toạ độ mẫu) để không chặn demo
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import type { LatLng } from '@/hooks/useLocation';

export function useCurrentLocation(): LatLng | null {
  const [loc, setLoc] = useState<LatLng | null>(null);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const last = await Location.getLastKnownPositionAsync();
        const pos = last ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (!cancelled && pos) setLoc({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      } catch {
        /* không có GPS → giữ địa chỉ mẫu */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return loc;
}

export default useCurrentLocation;
