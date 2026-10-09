// Cấu hình động bổ sung cho app.json: khoá Google Maps cho Android lấy từ biến môi trường lúc build
// (EAS: biến GOOGLE_MAPS_ANDROID_API_KEY của project — không commit khoá vào repo). Thiếu khoá thì app dùng bản đồ thay thế.
import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const mapsKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  return {
    ...config,
    name: config.name ?? '',
    slug: config.slug ?? '',
    android: {
      ...config.android,
      ...(mapsKey ? { config: { ...config.android?.config, googleMaps: { apiKey: mapsKey } } } : {}),
    },
    // app đọc được lúc chạy (android.config bị Expo loại khỏi cấu hình công khai) — chỉ là cờ, không chứa khoá
    extra: { ...config.extra, hasGoogleMapsKey: Boolean(mapsKey) },
  };
};
