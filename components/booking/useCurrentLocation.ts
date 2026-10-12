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

/**
 * Vị trí hiện tại theo yêu cầu (nút định vị): hỏi quyền nếu chưa có, giới hạn thời gian để hộp thoại quyền / GPS chậm
 * không treo thao tác. Web: dùng geolocation của trình duyệt (có thể bị từ chối → null).
 */
export async function getCurrentLatLng(timeoutMs = 6000): Promise<LatLng | null> {
  const work = (async (): Promise<LatLng | null> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch {
      const last = await Location.getLastKnownPositionAsync();
      return last ? { latitude: last.coords.latitude, longitude: last.coords.longitude } : null;
    }
  })();
  try {
    return await Promise.race([work, new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs))]);
  } catch {
    return null;
  }
}

export default useCurrentLocation;
