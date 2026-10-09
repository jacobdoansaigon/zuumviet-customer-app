// Bản đồ Goong: nền bản đồ cần Maptiles key (key hiển thị, nằm trong app nên coi là công khai) — đưa vào lúc build qua
// EXPO_PUBLIC_GOONG_MAPTILES_KEY (EAS env của project / biến build Railway / .env khi chạy dev).
// Chưa có key → các màn bản đồ dùng bản đồ thay thế (vẽ giả), app vẫn chạy bình thường.
const KEY = process.env.EXPO_PUBLIC_GOONG_MAPTILES_KEY ?? '';
// chỉ để thử khi chưa có key Goong (vd style OpenFreeMap) — bản phát hành không đặt biến này
const STYLE_OVERRIDE = process.env.EXPO_PUBLIC_MAP_STYLE_URL ?? '';

export const goongStyleUrl: string | null =
  STYLE_OVERRIDE || (KEY ? `https://tiles.goong.io/assets/goong_map_web.json?api_key=${encodeURIComponent(KEY)}` : null);

export const mapsAvailable = goongStyleUrl !== null;
