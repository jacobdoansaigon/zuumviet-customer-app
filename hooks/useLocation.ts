// useLocation — track driver's real-time GPS position
import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';

export type LatLng = {
  latitude: number;
  longitude: number;
};

type UseLocationResult = {
  location: LatLng | null;
  error: string | null;
  loading: boolean;
  requestPermission: () => Promise<boolean>;
};

/**
 * Vị trí hiện tại 1 lần, không ném lỗi (null khi bị từ chối quyền / web không hỗ trợ / timeout).
 * Dùng cho các API BE bắt buộc lat/long (huỷ đơn, cập nhật trạng thái) — vẫn gửi 0/0 nếu không lấy được.
 */
export async function getCurrentPositionSafe(timeoutMs = 4000): Promise<LatLng | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      const req = await Location.requestForegroundPermissionsAsync();
      if (req.status !== 'granted') return null;
    }
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
    if (!pos) {
      const last = await Location.getLastKnownPositionAsync();
      return last ? { latitude: last.coords.latitude, longitude: last.coords.longitude } : null;
    }
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    return null;
  }
}

export function useLocation(watch = false): UseLocationResult {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const requestPermission = async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setError('Ứng dụng cần quyền truy cập vị trí để hoạt động.');
        setLoading(false);
        return;
      }

      // Get initial position
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      if (!cancelled) {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLoading(false);
      }

      // Watch position for live tracking
      if (watch) {
        watchRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,   // every 3s
            distanceInterval: 10, // or every 10m
          },
          (pos) => {
            if (!cancelled) {
              setLocation({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              });
            }
          }
        );
      }
    };

    init().catch((e) => setError(e.message));

    return () => {
      cancelled = true;
      watchRef.current?.remove();
    };
  }, [watch]);

  return { location, error, loading, requestPermission };
}
