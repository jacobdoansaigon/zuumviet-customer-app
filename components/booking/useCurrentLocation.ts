// useCurrentLocation — lấy GPS 1 lần trên native (điểm đón mặc định, gợi ý gần); web không xin quyền → null
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
export type LatLng = { latitude: number; longitude: number };

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
        /* không có GPS → khách tự chọn địa điểm */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return loc;
}

export default useCurrentLocation;
