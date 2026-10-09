// services/maps.ts — bản đồ native có dùng được không.
// Android: react-native-maps chạy trên Google Maps SDK — APK build thiếu API key (android.config.googleMaps.apiKey,
// đưa vào lúc build từ biến GOOGLE_MAPS_ANDROID_API_KEY trong app.config.ts → cờ extra.hasGoogleMapsKey) thì MapView làm app THOÁT ngay khi mở bản đồ.
// Khi chưa có key → các màn dùng bản đồ thay thế (giống bản web) để app không thoát. iOS dùng Apple Maps, không cần key.
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// cờ do app.config.ts đặt (android.config chứa khoá bị Expo loại khỏi cấu hình đọc được lúc chạy)
export const nativeMapsAvailable: boolean = Platform.OS !== 'android' || Constants.expoConfig?.extra?.hasGoogleMapsKey === true;
