// ⚠️ MOCK DATA — dữ liệu giả lập cho các màn chưa có backend
// (Tin tức, Hộp thư, Cộng đồng, Tài xế yêu thích, Vị trí đã lưu, số dư ví hiển thị trên Home).
// Khi BE sẵn sàng, thay bằng service thật trong services/<domain>.ts.

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

/** 500000 → "500k" (rút gọn doanh thu thành viên) */
export function formatShortVnd(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}tr`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

/** Lời chào theo giờ trong ngày (Figma: "Chào buổi tối, Thanh Tùng") */
export function getGreeting(date = new Date()): string {
  const h = date.getHours();
  if (h >= 5 && h < 11) return 'Chào buổi sáng';
  if (h >= 11 && h < 14) return 'Chào buổi trưa';
  if (h >= 14 && h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

/** Date → "12:19pm" (kiểu banner chuyến đang đi) */
export function formatTime12h(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const suffix = h >= 12 ? 'pm' : 'am';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m}${suffix}`;
}

/* ------------------------------------------------------------------ */
/* Ví — fallback khi services/wallet.ts chưa trả số dư (xem hooks/useWalletBalance) */
/* ------------------------------------------------------------------ */

export const MOCK_WALLET = {
  balance: 24_000, // Tài khoản chính
  reward: 0, // Tài khoản thưởng
};

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

export const MOCK_NEWS: NewsItem[] = [
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
      'Tính năng Cộng đồng cho phép bạn kết nối với những người dùng khác thông qua mã giới thiệu 6 số hoặc mã QR. Khi thành viên trong cộng đồng hoàn thành chuyến đi, bạn sẽ nhận được phần thưởng tương ứng vào Tài khoản thưởng.',
      'Vào tab Cộng đồng → "Mời thành viên tham gia" để lấy mã giới thiệu của bạn.',
    ],
  },
  {
    id: 'n4',
    title: 'Hướng dẫn nạp tiền vào tài khoản ZuumViet qua MoMo',
    excerpt:
      'Nạp tiền nhanh chỉ với 3 bước qua ví MoMo, tiền vào tài khoản ngay lập tức. Hỗ trợ chuyển khoản ngân hàng trong thời gian tới.',
    image: 'https://picsum.photos/seed/zuum-news-4/800/450',
    date: '02/09/2026',
    body: [
      'Bước 1: Vào Hồ sơ → Tài khoản → Nạp tiền. Bước 2: Chọn số tiền muốn nạp (tối thiểu 10.000đ, tối đa 2.000.000đ). Bước 3: Chọn nguồn tiền MoMo và xác nhận thanh toán trong ứng dụng MoMo.',
      'Sau khi giao dịch thành công, số dư sẽ được cập nhật ngay trên màn hình Tài khoản chính.',
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
/* Khuyến mãi (Home: lưới 2 hàng, cuộn ngang)                          */
/* ------------------------------------------------------------------ */

export type PromoItem = {
  id: string;
  /** Tiêu đề ngắn trên thẻ (tối đa 2 dòng) */
  title: string;
  /** Nhóm dịch vụ áp dụng, hiển thị dạng tag nhỏ */
  tag: string;
  /** Nhãn ưu đãi nổi bật trên ảnh: "-20%", "-30K", "0Đ"... */
  discount: string;
  code: string;
  /** dd/mm/yyyy */
  expiry: string;
  image: string;
  /** ServiceKey mở màn đặt khi bấm "Đặt ngay" */
  service: string;
  summary: string;
  conditions: string[];
};

export const MOCK_PROMOS: PromoItem[] = [
  {
    id: 'p1',
    title: 'Giảm 20% đơn giao hàng đầu tiên',
    tag: 'Giao hàng',
    discount: '-20%',
    code: 'MUAXUAN2020',
    expiry: '31/10/2026',
    image: 'https://picsum.photos/seed/zuum-promo-1/600/380',
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
    image: 'https://picsum.photos/seed/zuum-promo-2/600/380',
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
    image: 'https://picsum.photos/seed/zuum-promo-3/600/380',
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
    image: 'https://picsum.photos/seed/zuum-promo-4/600/380',
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
    image: 'https://picsum.photos/seed/zuum-promo-5/600/380',
    service: 'intercity',
    summary: 'Giảm 10% cho chuyến Xe đường dài từ TP.HCM đi Vũng Tàu, Đà Lạt, Cần Thơ, tối đa 100.000đ.',
    conditions: ['Áp dụng Xe 4 chỗ và Xe 7 chỗ đường dài', 'Quãng đường tối thiểu 80km', 'Giảm tối đa 100.000đ/chuyến', 'Đặt trước tối thiểu 4 giờ'],
  },
  {
    id: 'p6',
    title: 'Chuyển nhà cuối tuần giảm 50K',
    tag: 'Vận tải',
    discount: '-50K',
    code: 'CHUYENNHA50',
    expiry: '31/12/2026',
    image: 'https://picsum.photos/seed/zuum-promo-6/600/380',
    service: 'transport',
    summary: 'Giảm 50.000đ cho chuyến Xe tải nhỏ hoặc Xe tải trung đặt vào thứ 7, chủ nhật.',
    conditions: ['Áp dụng Xe tải nhỏ (500kg) và Xe tải trung (1000kg)', 'Ngày lấy hàng rơi vào thứ 7 hoặc chủ nhật', 'Cước tối thiểu 250.000đ'],
  },
  {
    id: 'p7',
    title: 'Thuê tài xế 8 giờ, tặng thêm 1 giờ',
    tag: 'Gọi tài xế',
    discount: '+1H',
    code: 'TAIXE8H',
    expiry: '30/11/2026',
    image: 'https://picsum.photos/seed/zuum-promo-7/600/380',
    service: 'driver',
    summary: 'Đặt gói Tài xế 8 giờ được cộng thêm 1 giờ miễn phí, không giới hạn số lần.',
    conditions: ['Áp dụng gói "Tài xế 8 giờ"', 'Giờ tặng không quy đổi thành tiền', 'Đặt trước tối thiểu 12 giờ'],
  },
  {
    id: 'p8',
    title: 'Mời bạn bè, nhận 20K mỗi người',
    tag: 'Cộng đồng',
    discount: '+20K',
    code: 'MOIBAN20',
    expiry: '31/12/2026',
    image: 'https://picsum.photos/seed/zuum-promo-8/600/380',
    service: 'delivery',
    summary: 'Mỗi người bạn đăng ký bằng mã giới thiệu của bạn và hoàn thành 1 đơn, bạn nhận 20.000đ vào Tài khoản thưởng.',
    conditions: ['Người được mời phải là tài khoản mới', 'Thưởng ghi nhận sau khi đơn đầu tiên hoàn thành', 'Không giới hạn số người mời'],
  },
];

/* ------------------------------------------------------------------ */
/* Hộp thư                                                             */
/* ------------------------------------------------------------------ */

export type InboxType = 'promo' | 'order' | 'system';

export type InboxItem = {
  id: string;
  type: InboxType;
  title: string;
  excerpt: string;
  /** Hiển thị trên list: "3 giờ trước" / "Hôm qua, 15:00" / "Ngày 20/08/2020 18:00" */
  time: string;
  /** Hiển thị trong chi tiết */
  date: string;
  read: boolean;
  body: string[];
  /** Mã ưu đãi (nút "Áp dụng" trong chi tiết) */
  promoCode?: string;
};

export const MOCK_INBOX: InboxItem[] = [
  {
    id: 'm1',
    type: 'promo',
    title: 'Tặng bạn mã giảm 20% cho đơn Siêu tốc',
    excerpt: 'Nhập mã MUAXUAN2020 để được giảm 20% (tối đa 30.000đ) cho đơn Siêu tốc tiếp theo.',
    time: '3 giờ trước',
    date: '24/09/2026 08:15',
    read: false,
    promoCode: 'MUAXUAN2020',
    body: [
      'Cảm ơn bạn đã đồng hành cùng ZuumViet! Chúng tôi gửi tặng bạn mã ưu đãi MUAXUAN2020 – giảm 20% (tối đa 30.000đ) cho đơn giao hàng Siêu tốc tiếp theo.',
      'Mã có hiệu lực đến hết ngày 31/10/2026. Nhấn "Áp dụng" để lưu mã vào lần đặt hàng kế tiếp.',
    ],
  },
  {
    id: 'm2',
    type: 'order',
    title: 'Đơn hàng #20LTXA04 đã giao thành công',
    excerpt: 'Tài xế Phan Thanh Tùng đã giao hàng đến 78 Trần Văn Kỷ. Hãy đánh giá chuyến đi của bạn.',
    time: 'Hôm qua, 15:00',
    date: '23/09/2026 15:00',
    read: false,
    body: [
      'Đơn hàng #20LTXA04 của bạn đã được giao thành công đến 78 Trần Văn Kỷ, Phường 14, Quận Bình Thạnh lúc 14:58.',
      'Tổng phí: đ44.000 · Hình thức thanh toán: Tiền mặt.',
      'Hãy dành 1 phút đánh giá tài xế để giúp ZuumViet cải thiện dịch vụ.',
    ],
  },
  {
    id: 'm3',
    type: 'system',
    title: 'Cập nhật Điều khoản dịch vụ',
    excerpt: 'Điều khoản dịch vụ và Chính sách bảo mật của ZuumViet được cập nhật từ ngày 01/10/2026.',
    time: 'Ngày 20/09/2026 18:00',
    date: '20/09/2026 18:00',
    read: true,
    body: [
      'ZuumViet cập nhật Điều khoản dịch vụ và Chính sách bảo mật nhằm làm rõ hơn quyền lợi của khách hàng khi sử dụng dịch vụ giao hàng và vận tải.',
      'Các thay đổi sẽ có hiệu lực từ ngày 01/10/2026. Việc tiếp tục sử dụng ứng dụng đồng nghĩa bạn đồng ý với các điều khoản mới. Xem chi tiết tại Hồ sơ → Chính sách ZuumViet.',
    ],
  },
  {
    id: 'm4',
    type: 'promo',
    title: 'Nạp 100.000đ, tặng ngay 10.000đ vào Tài khoản thưởng',
    excerpt: 'Ưu đãi nạp tiền qua MoMo áp dụng đến hết 30/09/2026.',
    time: 'Ngày 15/09/2026 09:30',
    date: '15/09/2026 09:30',
    read: true,
    promoCode: 'NAP100',
    body: [
      'Nạp tối thiểu 100.000đ vào Tài khoản chính qua MoMo trong thời gian khuyến mãi để nhận thêm 10.000đ vào Tài khoản thưởng.',
      'Mỗi khách hàng nhận tối đa 1 lần. Tiền thưởng được cộng trong vòng 24 giờ sau khi nạp thành công.',
    ],
  },
  {
    id: 'm5',
    type: 'order',
    title: 'Đơn hàng #19KHBN12 đã bị huỷ',
    excerpt: 'Bạn đã huỷ đơn với lý do "Người nhận hẹn lại ngày giao". Không phát sinh phí huỷ.',
    time: 'Ngày 12/09/2026 10:42',
    date: '12/09/2026 10:42',
    read: true,
    body: [
      'Đơn hàng #19KHBN12 đã được huỷ theo yêu cầu của bạn. Lý do: Người nhận hẹn lại ngày giao.',
      'Không phát sinh phí huỷ cho đơn hàng này. Bạn có thể đặt lại đơn bất kỳ lúc nào từ màn hình Trang chủ.',
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Cộng đồng                                                           */
/* ------------------------------------------------------------------ */

export type CommunityMember = {
  id: string;
  name: string;
  code: string; // "MS: 201002889"
  revenue: number;
  tier?: 'Bạc' | 'Vàng' | 'Kim Cương';
};

export const MOCK_COMMUNITY = {
  /** Mã giới thiệu của chính user (màn "Mời thành viên tham gia") */
  myInviteCode: '345678',
  /** Mã giới thiệu hợp lệ để join (màn "Tham gia cộng đồng") */
  validJoinCodes: ['298595', '123456'],
  leader: {
    name: 'Nguyễn Văn A',
    role: 'Nhóm trưởng',
    code: 'MS: 298-595-3904',
    revenue: 1_000_000,
    members: 576,
    memberCapacity: 1728,
    reward: 1_500_000,
  },
  /** Home stat cards: "10 thành viên" / "10 điểm thưởng" */
  homeStats: { members: 10, points: 10 },
  level1: { count: 24, capacity: 24 },
  members: [
    { id: 'c1', name: 'David Key', code: 'MS: 201002889', revenue: 500_000, tier: 'Vàng' },
    { id: 'c2', name: 'Trần Minh Quân', code: 'MS: 201003114', revenue: 420_000, tier: 'Bạc' },
    { id: 'c3', name: 'Lê Thị Hồng Nhung', code: 'MS: 201003278', revenue: 1_250_000, tier: 'Kim Cương' },
    { id: 'c4', name: 'Phạm Quốc Bảo', code: 'MS: 201003501', revenue: 180_000 },
    { id: 'c5', name: 'Võ Ngọc Anh', code: 'MS: 201003622', revenue: 760_000, tier: 'Vàng' },
    { id: 'c6', name: 'Huỳnh Tấn Phát', code: 'MS: 201003790', revenue: 95_000 },
  ] as CommunityMember[],
  rewards: {
    month: 'Tháng 10',
    spent: 100_000,
    target: 5_000_000,
    ratingCurrent: 2.0,
    ratingTarget: 4.7,
    bonus: 5_100_000,
    /** tỉ lệ thưởng ước tính (bonus / target) dùng cho màn Ước tính */
    ratio: 5_100_000 / 5_000_000,
    minEstimate: 100_000,
  },
};

/* ------------------------------------------------------------------ */
/* Tài xế yêu thích                                                    */
/* ------------------------------------------------------------------ */

export type FavoriteDriver = {
  id: string;
  name: string;
  plate: string;
  car: string;
  rating: number;
  reviews: number;
  avatar?: string;
};

export type FavoriteDriverGroup = {
  vehicle: string;
  drivers: FavoriteDriver[];
};

const DRIVER_NAMES = [
  'Jube Bowman', 'Nguyễn Văn Hùng', 'Trần Đức Anh', 'Lê Hoàng Nam', 'Phạm Minh Tuấn', 'Võ Thành Long',
  'Đặng Quang Vinh', 'Bùi Xuân Trường', 'Hồ Văn Khoa', 'Đỗ Trung Kiên', 'Ngô Bảo Châu', 'Dương Văn Thái',
  'Lý Minh Hiếu', 'Phan Thanh Tùng', 'Trương Công Danh', 'Mai Văn Lâm', 'Tạ Quốc Huy', 'Vũ Đình Phúc',
  'Cao Văn Sơn', 'Lâm Hữu Nghĩa', 'Kiều Thanh Bình', 'Châu Ngọc Hải', 'Đinh Tiến Đạt', 'Hà Văn Đức',
];
const PLATES = ['53A-888.88', '51F-123.45', '59C1-456.78', '60A-234.56', '51G-789.01', '59H2-112.33'];
const CARS: Record<string, string[]> = {
  'Zuum Luxury - Black': ['Civic Trắng', 'Camry Đen', 'Mazda 6 Xám', 'Accord Đen', 'Mercedes C200 Trắng', 'Lexus ES Đen'],
  'Zuum Car': ['Vios Bạc', 'Accent Trắng', 'City Đỏ', 'Cerato Xanh', 'Mazda 3 Đỏ', 'Altis Đen'],
  'Zuum Bike': ['Air Blade Đen', 'Vision Trắng', 'Wave Xanh', 'Exciter Đỏ', 'Sirius Đen', 'Lead Xám'],
  'Zuum Truck': ['Suzuki 500kg', 'Hyundai 1 tấn', 'Kia K200', 'Thaco 750kg', 'Isuzu 1.9 tấn', 'Hino 2 tấn'],
};

function buildFavoriteDrivers(): FavoriteDriverGroup[] {
  let i = 0;
  return Object.entries(CARS).map(([vehicle, cars]) => ({
    vehicle,
    drivers: cars.map((car, k) => {
      const idx = i++;
      return {
        id: `d${idx + 1}`,
        name: DRIVER_NAMES[idx % DRIVER_NAMES.length],
        plate: PLATES[(idx + k) % PLATES.length],
        car,
        rating: Number((4.6 + ((idx * 7) % 4) / 10).toFixed(1)),
        reviews: 96 + ((idx * 37) % 160),
      };
    }),
  }));
}

/** 4 nhóm × 6 tài xế = 24 (Figma: "Tài xế yêu thích (24)") */
export const MOCK_FAVORITE_DRIVERS: FavoriteDriverGroup[] = buildFavoriteDrivers();

/* ------------------------------------------------------------------ */
/* Vị trí đã lưu                                                       */
/* ------------------------------------------------------------------ */

export type SavedLocation = {
  id: string;
  name: string;
  address: string;
  icon: IconName;
};

export const MOCK_SAVED_LOCATIONS: SavedLocation[] = [
  { id: 'home', name: 'Nhà', address: '51 Yên Thế, Tân Bình, Hồ Chí Minh', icon: 'ion:home-outline' },
  { id: 'office', name: 'Công ty', address: '182 Lê Đại Hành, Phường 15, Quận 10, Hồ Chí Minh', icon: 'ion:business-outline' },
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

export const MOCK_POLICIES: PolicyItem[] = [
  {
    id: 'support',
    label: 'Hỗ trợ',
    icon: 'ion:headset-outline',
    paragraphs: [
      'Tổng đài hỗ trợ khách hàng ZuumViet hoạt động 24/7: 1900 6868 (1.000đ/phút).',
      'Email: support@zuumviet.vn — phản hồi trong vòng 24 giờ làm việc.',
      'Bạn cũng có thể yêu cầu Tư vấn viên gọi lại từ màn hình chi tiết giao dịch hoặc chi tiết chuyến đi.',
    ],
  },
  {
    id: 'terms',
    label: 'Điều khoản dịch vụ',
    icon: 'ion:document-text-outline',
    paragraphs: [
      '1. ZuumViet là nền tảng kết nối khách hàng với tài xế cung cấp dịch vụ giao hàng, vận tải và thuê xe.',
      '2. Khách hàng có trách nhiệm cung cấp thông tin người nhận, địa chỉ và mô tả hàng hoá chính xác. Hàng hoá bị cấm vận chuyển theo quy định pháp luật sẽ bị từ chối.',
      '3. Phí dịch vụ được hiển thị trước khi xác nhận đơn và đã bao gồm VAT. Phụ phí (giao tận tay, quay lại điểm giao, tiền tip) do khách hàng chủ động lựa chọn.',
      '4. Khách hàng có thể huỷ đơn miễn phí trước khi tài xế đến điểm lấy hàng. Sau thời điểm này, phí huỷ có thể được áp dụng.',
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
