// constants/content.ts — NỘI DUNG TĨNH (marketing / thông tin chung, không phải dữ liệu của người dùng):
// tin tức, khuyến mãi trên Home, "Tại sao chọn ZuumViet", banner đối tác, footer, chính sách, hotline.
// API chưa có nội dung banner/tin tức → giữ tĩnh trong app. Mọi dữ liệu của người dùng lấy từ API (services/*).

import type { IconName } from '@/components/ui/Icon';

/* ------------------------------------------------------------------ */
/* Format helpers                                                      */
/* ------------------------------------------------------------------ */

/** 24000 → "24.000" (chuẩn VN, dấu chấm ngăn nghìn) */
export function formatVnd(n: number): string {
  const sign = n < 0 ? '-' : '';
  const digits = Math.round(Math.abs(n)).toString();
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** 24000 → "đ24.000" (kiểu badge Figma) ; space=true → "đ 24.000" (kiểu thẻ ví) */
export function formatMoney(n: number, space = false): string {
  return `đ${space ? ' ' : ''}${formatVnd(n)}`;
}

/** Lời chào theo giờ trong ngày (Figma: "Chào buổi tối, Thanh Tùng") */
export function getGreeting(date = new Date()): string {
  const h = date.getHours();
  if (h >= 5 && h < 11) return 'Chào buổi sáng';
  if (h >= 11 && h < 14) return 'Chào buổi trưa';
  if (h >= 14 && h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

/* ------------------------------------------------------------------ */
/* Tin tức                                                             */
/* ------------------------------------------------------------------ */

export type NewsItem = {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  body: string[];
};

export const NEWS: NewsItem[] = [
  {
    id: 'n1',
    title: 'ZuumViet ra mắt dịch vụ Siêu tốc: giao nội thành trong 1 giờ',
    excerpt:
      'Từ hôm nay, khách hàng tại TP.HCM có thể chọn dịch vụ Siêu tốc để giao hàng nội thành trong vòng 60 phút với mức phí chỉ từ 25.000đ.',
    image: 'https://picsum.photos/seed/zuum-news-1/800/450',
    date: '20/09/2026',
    body: [
      'ZuumViet chính thức triển khai dịch vụ giao hàng Siêu tốc tại khu vực TP. Hồ Chí Minh. Đơn hàng sẽ được tài xế nhận trong vòng 5 phút và giao đến tay người nhận trong tối đa 60 phút kể từ khi lấy hàng.',
      'Dịch vụ áp dụng cho các kiện hàng dưới 30kg, kích cỡ tối đa 50x40x40cm. Phí dịch vụ được tính theo quãng đường thực tế và đã bao gồm VAT.',
      'Trong tháng ra mắt, khách hàng nhập mã MUAXUAN2020 để được giảm 20% cho 3 đơn Siêu tốc đầu tiên. Chúc bạn có trải nghiệm giao hàng nhanh chóng cùng ZuumViet!',
    ],
  },
  {
    id: 'n2',
    title: 'Giảm 20% cho đơn hàng đầu tiên với mã MUAXUAN2020',
    excerpt:
      'Nhập mã MUAXUAN2020 khi xác nhận đơn để nhận ưu đãi giảm 20%, tối đa 30.000đ. Áp dụng cho tất cả dịch vụ giao hàng.',
    image: 'https://picsum.photos/seed/zuum-news-2/800/450',
    date: '15/09/2026',
    body: [
      'Chương trình ưu đãi dành riêng cho khách hàng mới của ZuumViet. Mã giảm giá được áp dụng trực tiếp tại bước "Xác nhận giao hàng" hoặc trong mục "Nhập mã ưu đãi".',
      'Điều kiện: đơn hàng có giá trị tối thiểu 30.000đ, mỗi tài khoản sử dụng tối đa 1 lần. Thời gian áp dụng đến hết ngày 31/10/2026.',
    ],
  },
  {
    id: 'n3',
    title: 'Mời bạn bè tham gia cộng đồng, nhận tiền thưởng mỗi chuyến',
    excerpt:
      'Chia sẻ mã giới thiệu để xây dựng cộng đồng của bạn. Mỗi chuyến xe của thành viên cấp dưới sẽ mang lại tiền thưởng cho bạn.',
    image: 'https://picsum.photos/seed/zuum-news-3/800/450',
    date: '10/09/2026',
    body: [
      'Tính năng Cộng đồng cho phép bạn kết nối với những người dùng khác thông qua mã giới thiệu (mã tài khoản của bạn). Khi thành viên trong cộng đồng hoàn thành chuyến đi, bạn nhận được phần thưởng tương ứng vào ví ZuumViet.',
      'Vào tab Cộng đồng → "Mời thành viên tham gia" để lấy mã giới thiệu của bạn.',
    ],
  },
  {
    id: 'n4',
    title: 'Hướng dẫn nạp tiền vào ví ZuumViet qua VNPay',
    excerpt:
      'Nạp tiền nhanh chỉ với 3 bước qua cổng VNPay (thẻ ATM, Internet Banking, QR ngân hàng), tiền vào ví ngay sau khi thanh toán.',
    image: 'https://picsum.photos/seed/zuum-news-4/800/450',
    date: '02/09/2026',
    body: [
      'Bước 1: Vào Hồ sơ → Tài khoản → Nạp tiền. Bước 2: Chọn số tiền muốn nạp (tối thiểu 10.000đ). Bước 3: Thanh toán trên trang VNPay rồi quay lại ứng dụng.',
      'Sau khi giao dịch thành công, số dư ví được cập nhật ngay trên màn hình Tài khoản.',
    ],
  },
  {
    id: 'n5',
    title: 'ZuumViet mở rộng dịch vụ Vận tải và Thuê xe tải theo giờ',
    excerpt:
      'Đáp ứng nhu cầu chuyển nhà, chở hàng cồng kềnh với đội xe tải 500kg – 2 tấn, đặt xe ngay trên ứng dụng.',
    image: 'https://picsum.photos/seed/zuum-news-5/800/450',
    date: '28/08/2026',
    body: [
      'Dịch vụ Vận tải và Thuê xe tải hiện đã có mặt tại TP.HCM, Bình Dương và Đồng Nai. Khách hàng có thể chọn loại xe phù hợp (Xe Tải Nhỏ 500kg, Xe Tải Trung 1000kg, Xe Tải Lớn 2000kg) và đặt lịch trước tối đa 7 ngày.',
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Tại sao chọn ZuumViet (Home)                                        */
/* ------------------------------------------------------------------ */

export type WhyZuumItem = {
  id: string;
  /** IconName dạng chuỗi (ion:/mci:) */
  icon: string;
  title: string;
  description: string;
};

export const WHY_ZUUM: WhyZuumItem[] = [
  {
    id: 'w1',
    icon: 'mci:graph-outline',
    title: 'Cộng đồng chia sẻ thu nhập',
    description: 'Mỗi chuyến của thành viên bạn giới thiệu đều mang điểm thưởng về cho bạn. Càng mời nhiều, càng nhận nhiều.',
  },
  {
    id: 'w2',
    icon: 'mci:cash-check',
    title: 'Giá rõ ràng, không phụ phí ẩn',
    description: 'Báo giá trước khi đặt, đã gồm VAT. Bạn thấy đúng số tiền phải trả trước khi bấm Xác nhận.',
  },
  {
    id: 'w3',
    icon: 'ion:shield-checkmark-outline',
    title: 'Tài xế được xác minh',
    description: 'Tài xế và thợ đều được kiểm tra CMND, bằng lái, phương tiện. Đánh giá sau mỗi chuyến hiển thị công khai.',
  },
  {
    id: 'w4',
    icon: 'mci:view-grid-outline',
    title: 'Một ứng dụng, mọi nhu cầu',
    description: 'Xe máy, xe hơi, đường dài, giao hàng, vận tải, tài xế riêng. Một tài khoản, một ví, đặt trong 30 giây.',
  },
];

/* ------------------------------------------------------------------ */
/* Banner đối tác (Home, dưới cùng): quảng cáo của đối tác ZuumViet     */
/* ------------------------------------------------------------------ */

export type PartnerAd = {
  id: string;
  partner: string;
  headline: string;
  description: string;
  cta: string;
  url: string;
  /** 2 màu gradient nền banner (đến khi có ảnh banner thật) */
  colors: [string, string];
  /** ảnh banner (tuỳ chọn) — có thì đè lên nền gradient */
  image?: string;
};

export const PARTNER_ADS: PartnerAd[] = [
  {
    id: 'ad1',
    partner: 'MoMo',
    headline: 'Nạp ví ZuumViet qua MoMo, hoàn 10%',
    description: 'Áp dụng lần nạp đầu tiên, tối đa 20.000đ.',
    cta: 'Nạp ngay',
    url: 'https://momo.vn',
    colors: ['#A50064', '#D82D8B'],
  },
  {
    id: 'ad2',
    partner: 'Bảo hiểm PVI',
    headline: 'Bảo hiểm chuyến đi chỉ 2.000đ',
    description: 'Bảo vệ hành khách và hàng hoá trên mọi chuyến ZuumViet.',
    cta: 'Tìm hiểu',
    url: 'https://www.pvi.com.vn',
    colors: ['#0B4F9C', '#1E88E5'],
  },
  {
    id: 'ad3',
    partner: 'Petrolimex',
    headline: 'Tài xế ZuumViet giảm 500đ/lít',
    description: 'Xuất trình mã tài xế tại hơn 2.000 cây xăng toàn quốc.',
    cta: 'Xem điểm đổ',
    url: 'https://www.petrolimex.com.vn',
    colors: ['#0F6E3E', '#2EBD59'],
  },
];

/** Tổng đài hỗ trợ khách hàng (gọi từ màn theo dõi đơn, chi tiết chuyến, ví) */
export const SUPPORT_HOTLINE = '19001234';
export const SUPPORT_HOTLINE_LABEL = '1900 1234';

/** Thông tin hiển thị ở footer app */
export const APP_FOOTER = {
  tagline: 'Đi lại, giao hàng, vận tải. Một ứng dụng cho mọi nhu cầu.',
  company: 'Công ty TNHH ZuumViet',
  address: 'Tầng 5, 182 Lê Đại Hành, Phường 15, Quận 11, TP. Hồ Chí Minh',
  hotline: SUPPORT_HOTLINE_LABEL,
  hotlineTel: SUPPORT_HOTLINE,
  email: 'support@zuumviet.vn',
  termsUrl: 'https://zuumviet.vn/terms',
  privacyUrl: 'https://zuumviet.vn/privacy',
  website: 'https://zuumviet.vn',
} as const;

/* ------------------------------------------------------------------ */
/* Khuyến mãi (Home: lưới 2 hàng, cuộn ngang)                          */
/* ------------------------------------------------------------------ */

export type PromoItem = {
  id: string;
  /** Tiêu đề ngắn trên thẻ (tối đa 2 dòng) */
  title: string;
  /** Nhóm dịch vụ áp dụng, hiển thị dạng tag nhỏ */
  tag: string;
  /** Nhãn ưu đãi nổi bật trên khối minh hoạ: "-20%", "-30K", "0Đ"... */
  discount: string;
  code: string;
  /** dd/mm/yyyy */
  expiry: string;
  /** ServiceKey mở màn đặt khi bấm "Đặt ngay" — cũng dùng để suy ra icon/màu minh hoạ, xem promoVisual() */
  service: string;
  summary: string;
  conditions: string[];
};

export const PROMOS: PromoItem[] = [
  {
    id: 'p1',
    title: 'Giảm 20% đơn giao hàng đầu tiên',
    tag: 'Giao hàng',
    discount: '-20%',
    code: 'MUAXUAN2020',
    expiry: '31/10/2026',
    service: 'delivery',
    summary: 'Nhập mã khi xác nhận đơn để giảm 20%, tối đa 30.000đ cho đơn Giao hàng đầu tiên.',
    conditions: ['Áp dụng cho khách hàng chưa có đơn hoàn thành', 'Đơn tối thiểu 30.000đ, giảm tối đa 30.000đ', 'Mỗi tài khoản dùng 1 lần', 'Không áp dụng cùng ưu đãi khác'],
  },
  {
    id: 'p2',
    title: 'Xe máy đồng giá 10K nội thành',
    tag: 'Xe máy',
    discount: '10K',
    code: 'XEMAY10K',
    expiry: '15/10/2026',
    service: 'bike',
    summary: 'Chuyến Xe máy dưới 5km trong nội thành TP.HCM đồng giá 10.000đ, áp dụng khung 9h–16h.',
    conditions: ['Quãng đường tối đa 5km', 'Khung giờ 9:00 – 16:00 các ngày trong tuần', 'Tối đa 2 chuyến/ngày/tài khoản'],
  },
  {
    id: 'p3',
    title: 'Giảm 30K chuyến xe hơi đầu tiên',
    tag: 'Xe hơi',
    discount: '-30K',
    code: 'XEHOI30',
    expiry: '31/10/2026',
    service: 'car',
    summary: 'Trải nghiệm Xe 4 chỗ với ưu đãi giảm ngay 30.000đ cho chuyến đầu tiên.',
    conditions: ['Áp dụng cho Xe 4 chỗ và Xe 4 chỗ Plus', 'Cước chuyến tối thiểu 50.000đ', 'Mỗi tài khoản dùng 1 lần'],
  },
  {
    id: 'p4',
    title: 'Đi sân bay giảm 15% xe 6 chỗ',
    tag: 'Xe 6 chỗ',
    discount: '-15%',
    code: 'SANBAY15',
    expiry: '30/11/2026',
    service: 'car6',
    summary: 'Giảm 15% gói Xe 6 chỗ sân bay, tối đa 60.000đ, cả chiều đi và chiều về.',
    conditions: ['Áp dụng gói "Xe 6 chỗ sân bay"', 'Giảm tối đa 60.000đ/chuyến', 'Đặt trước tối thiểu 2 giờ'],
  },
  {
    id: 'p5',
    title: 'Xe đường dài giảm 10% chuyến liên tỉnh',
    tag: 'Xe đường dài',
    discount: '-10%',
    code: 'DUONGDAI10',
    expiry: '31/12/2026',
    service: 'intercity',
    summary: 'Giảm 10% cho chuyến Xe đường dài từ TP.HCM đi Vũng Tàu, Đà Lạt, Cần Thơ, tối đa 100.000đ.',
    conditions: ['Áp dụng Xe 4 chỗ và Xe 7 chỗ đường dài', 'Quãng đường tối thiểu 80km', 'Giảm tối đa 100.000đ/chuyến', 'Đặt trước tối thiểu 4 giờ'],
  },
  {
    id: 'p6',
    title: 'Dọn nhà cuối tuần giảm 200K',
    tag: 'Dọn nhà',
    discount: '-200K',
    code: 'CHUYENNHA200',
    expiry: '31/12/2026',
    service: 'rental',
    summary: 'Giảm 200.000đ cho Gói căn hộ hoặc Gói nhà phố đặt chuyển vào thứ 7, chủ nhật.',
    conditions: ['Áp dụng Gói căn hộ và Gói nhà phố / văn phòng', 'Ngày chuyển rơi vào thứ 7 hoặc chủ nhật', 'Đặt trước tối thiểu 2 ngày'],
  },
  {
    id: 'p7',
    title: 'Tài xế lái thay Xe hơi, giảm 20K',
    tag: 'Tài xế lái thay',
    discount: '-20K',
    code: 'LAITHAY20',
    expiry: '30/11/2026',
    service: 'driver',
    summary: 'Giảm 20.000đ cho mỗi chuyến Tài xế lái thay Xe hơi, không giới hạn số lần.',
    conditions: ['Áp dụng gói "Xe hơi"', 'Không áp dụng gói "Xe máy"', 'Đặt trước tối thiểu 1 giờ'],
  },
  {
    id: 'p8',
    title: 'Mời bạn bè, nhận 20K mỗi người',
    tag: 'Cộng đồng',
    discount: '+20K',
    code: 'MOIBAN20',
    expiry: '31/12/2026',
    service: 'delivery',
    summary: 'Mỗi người bạn đăng ký bằng mã giới thiệu của bạn và hoàn thành 1 đơn, bạn nhận 20.000đ vào Tài khoản thưởng.',
    conditions: ['Người được mời phải là tài khoản mới', 'Thưởng ghi nhận sau khi đơn đầu tiên hoàn thành', 'Không giới hạn số người mời'],
  },
];

/* ------------------------------------------------------------------ */
/* Chính sách ZuumViet                                                 */
/* ------------------------------------------------------------------ */

export type PolicyItem = {
  id: 'support' | 'terms' | 'privacy' | 'drive';
  label: string;
  icon: IconName;
  paragraphs: string[];
};

export const POLICIES: PolicyItem[] = [
  {
    id: 'support',
    label: 'Hỗ trợ',
    icon: 'ion:headset-outline',
    paragraphs: [
      'Tổng đài hỗ trợ khách hàng ZuumViet hoạt động 24/7: 1900 1234.',
      'Email: support@zuumviet.vn — phản hồi trong vòng 24 giờ làm việc.',
      'Bạn có thể gọi tổng đài ngay từ màn hình theo dõi đơn, chi tiết chuyến đi hoặc chi tiết giao dịch.',
    ],
  },
  {
    id: 'terms',
    label: 'Điều khoản dịch vụ',
    icon: 'ion:document-text-outline',
    paragraphs: [
      '1. ZuumViet là nền tảng kết nối khách hàng với tài xế cung cấp dịch vụ giao hàng, vận tải và thuê xe.',
      '2. Khách hàng có trách nhiệm cung cấp thông tin người nhận, địa chỉ và mô tả hàng hoá chính xác. Hàng hoá bị cấm vận chuyển theo quy định pháp luật sẽ bị từ chối.',
      '3. Phí dịch vụ được báo trước khi xác nhận đơn. Các tuỳ chọn tính thêm phí (quay về điểm đón, dịch vụ cộng thêm, tiền tip) do khách hàng chủ động lựa chọn.',
      '4. Khách hàng huỷ miễn phí khi chưa có tài xế nhận đơn hoặc trong thời gian miễn phí sau khi tài xế nhận; quá thời gian này có thể phát sinh phí huỷ (hiển thị trước khi xác nhận huỷ).',
    ],
  },
  {
    id: 'privacy',
    label: 'Chính sách bảo mật',
    icon: 'ion:lock-closed-outline',
    paragraphs: [
      'ZuumViet thu thập số điện thoại, họ tên, email và vị trí để cung cấp dịch vụ và hỗ trợ khách hàng.',
      'Thông tin của bạn không được bán cho bên thứ ba. Dữ liệu vị trí chỉ được sử dụng trong quá trình thực hiện đơn hàng.',
      'Bạn có quyền yêu cầu xoá tài khoản và dữ liệu cá nhân bằng cách liên hệ bộ phận Hỗ trợ.',
    ],
  },
  {
    id: 'drive',
    label: 'Lái xe cùng ZuumViet',
    icon: 'ion:car-outline',
    paragraphs: [
      'Trở thành đối tác tài xế ZuumViet để gia tăng thu nhập với lịch làm việc linh hoạt.',
      'Yêu cầu: từ 18 tuổi, có CMND/CCCD, bằng lái phù hợp và phương tiện đăng ký chính chủ hoặc có uỷ quyền.',
      'Tải ứng dụng ZUUMDRIVER và đăng ký trong 5 bước — đội ngũ ZuumViet sẽ duyệt hồ sơ trong 24 giờ.',
    ],
  },
];
