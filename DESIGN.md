# Design system — ZuumViet mobile

Nguồn thiết kế: Figma **ZuumViet Mobile App Design**
(https://www.figma.com/design/wqhoCx3lXxrDX1gskW8x1y/ZuumViet-Mobile-App-Design)

## Tokens (`constants/theme.ts`)
| Token | Giá trị | Dùng cho |
|---|---|---|
| `Colors.primary` | `#59267C` | header tím, nút chính, icon tab active |
| `Colors.headerBg` | `#F9F6FA` | header sáng (auth, tab) |
| `Colors.success` | `#6DBCB8` | nút gọi, toast thành công, banner |
| `Colors.secondary` | `#F0B341` | icon thống kê, sao đánh giá, km |
| `Colors.error` | `#D24847` | lỗi, nút "Báo sự cố", "Thất bại" |
| `Colors.surfaceAlt` | `#F2F2F2` | nền input, ô OTP, tile chưa chọn |
| `Colors.text` / `textSecondary` | `#1A1A1A` / `#737373` | chữ |
| Font | **Mulish** (Figma: Muli) | `hooks/useAppFonts.ts` |

Quy ước header: màn auth & tab dùng `AppHeader variant="light"`; luồng đặt hàng, ví, chi tiết đơn, tài xế trong cuốc dùng `variant="dark"`.

## UI kit (`components/ui/`)
`AppText`, `Icon`/`Icons`, `Button`, `AppHeader`, `TextField`, `PhoneInput`, `CodeInput`, `Chip`, `Badge`,
`ListRow`, `Card`, `Avatar`, `EmptyState`, `Toast`/`Banner`, `BottomSheet`, `Dialog`/`ErrorSheet`,
`RouteStops`, `Logo`, `Stepper`, `Radio`/`Checkbox`/`SwitchRow`, `SectionHeader`, `StatCard`, `ServiceOption`, `Screen`.

`constants/theme.ts`, `components/ui/*`, `hooks/useAppFonts.ts` **giống hệt nhau** giữa
`zv-customer-app` và `zv-driver-app` — sửa ở một nơi rồi copy sang nơi kia.
