// promoVisual — ảnh minh hoạ cho thẻ/khuyến mãi (PromoCard + màn chi tiết) LUÔN đúng nội dung: dùng
// icon + màu theo đúng dịch vụ áp dụng (SERVICE_GROUPS) thay vì ảnh chụp ngẫu nhiên (picsum) không ăn
// nhập gì với nội dung (vd promo "Giảm 20% Giao hàng" trước đây lại hiện ảnh máy ảnh cổ).
import { Colors, Palette } from '@/constants/theme';
import { Icons, type IconName } from '@/components/ui';
import { SERVICE_GROUPS, toServiceKey, type ServiceKey } from '@/constants/mockBooking';
import type { PromoItem } from '@/constants/mock';

/** [đậm, nhạt] theo ServiceKey — tái dùng token màu đã có trong design system, không bịa màu mới */
const SERVICE_GRADIENTS: Partial<Record<ServiceKey, [string, string]>> = {
  delivery: [Palette.success[600], Colors.success], // teal — nhanh, đáng tin
  bike: ['#E65100', '#FF9800'], // cam — năng động, gắn với xe máy/2 bánh
  car: [Colors.infoDark, Colors.info], // xanh dương — an toàn, thoải mái
  car6: [Palette.primary[700], Palette.primary[400]], // tím đậm — xe lớn, sang trọng
  intercity: [Palette.danger[600], Palette.danger[300]], // đỏ cam — đường dài
  rental: ['#1E8C41', Colors.green], // xanh lá — dọn nhà, chuyển đi
  driver: [Palette.primary[600], Palette.primary[300]], // tím nhạt hơn car6 — tài xế riêng
  handyman: [Palette.warning[800], Palette.warning[600]], // vàng đậm — sửa chữa
  labor: ['#455A64', '#78909C'], // xám xanh — nhân công, công cụ
};

/** Ưu đãi "mời bạn bè" không thuộc dịch vụ cụ thể nào — dùng riêng icon chia sẻ + màu vàng giống hệt
 *  thẻ "Cộng đồng chia sẻ thu nhập" ở Trang chủ (constants/mock.ts WHY_ZUUM) cho nhất quán. */
const REFERRAL_GRADIENT: [string, string] = [Palette.warning[700], Colors.warning];

export function promoVisual(item: PromoItem): { icon: IconName; colors: [string, string] } {
  if (item.tag === 'Cộng đồng') {
    return { icon: Icons.share, colors: REFERRAL_GRADIENT };
  }
  const key = toServiceKey(item.service);
  return {
    icon: SERVICE_GROUPS[key].icon,
    colors: SERVICE_GRADIENTS[key] ?? [Colors.primary, Colors.primaryLight],
  };
}
