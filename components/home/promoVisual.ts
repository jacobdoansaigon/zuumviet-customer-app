// promoVisual — minh hoạ cho thẻ/khuyến mãi (PromoCard + màn chi tiết): ảnh banner của chương trình (PromoItem.image)
// nếu có; chưa có ảnh thì khối icon + màu theo đúng dịch vụ áp dụng (SERVICE_GROUPS) thay vì ảnh chụp ngẫu nhiên
// không ăn nhập gì với nội dung (vd promo "Giảm 20% Giao hàng" trước đây lại hiện ảnh máy ảnh cổ).
import { Colors, Palette } from '@/constants/theme';
import { Icons, type IconName, type ServiceIconName } from '@/components/ui';
import { SERVICE_GROUPS, toServiceKey, type ServiceKey } from '@/constants/booking';
import type { PromoItem } from '@/constants/content';

/** [đậm, nhạt] theo ServiceKey — tái dùng token màu đã có trong design system, không bịa màu mới */
const SERVICE_GRADIENTS: Partial<Record<ServiceKey, [string, string]>> = {
  delivery: [Palette.success[600], Colors.success], // teal — nhanh, đáng tin
  bike: ['#E65100', '#FF9800'], // cam — năng động, gắn với xe máy/2 bánh
  car: [Colors.infoDark, Colors.info], // xanh dương — an toàn, thoải mái
  intercity: [Palette.danger[600], Palette.danger[300]], // đỏ cam — đường dài
  rental: ['#1E8C41', Colors.green], // xanh lá — chuyển nhà, chuyển đi
  driver: [Palette.primary[600], Palette.primary[300]], // tím nhạt — tài xế riêng
  handyman: [Palette.warning[800], Palette.warning[600]], // vàng đậm — sửa chữa
  labor: ['#455A64', '#78909C'], // xám xanh — nhân công, công cụ
};

/** Ưu đãi "mời bạn bè" không thuộc dịch vụ cụ thể nào — dùng riêng icon chia sẻ + màu vàng cho nhất quán
 *  với banner "Cộng đồng chia sẻ thu nhập" ở Trang chủ (constants/content.ts WHY_ZUUM). */
const REFERRAL_GRADIENT: [string, string] = [Palette.warning[700], Colors.warning];

export function promoVisual(item: PromoItem): { icon: IconName; colors: [string, string]; art: ServiceIconName | null } {
  if (item.tag === 'Cộng đồng') {
    return { icon: Icons.share, colors: REFERRAL_GRADIENT, art: null };
  }
  const key = toServiceKey(item.service);
  return {
    icon: SERVICE_GROUPS[key].icon,
    colors: SERVICE_GRADIENTS[key] ?? [Colors.primary, Colors.primaryLight],
    // "car6" (xe 6 chỗ) vẫn thuộc nhóm Xe hơi nhưng có icon riêng
    art: item.service === 'car6' ? 'car-7' : SERVICE_GROUPS[key].art,
  };
}

/** Số ngày còn lại tới hết HSD (dd/mm/yyyy, hết ngày đó); null nếu không đọc được */
export function daysLeft(expiry: string, now = new Date()): number | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(expiry.trim());
  if (!m) return null;
  const end = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 23, 59, 59);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((end.getTime() - today.getTime()) / 86_400_000);
}
