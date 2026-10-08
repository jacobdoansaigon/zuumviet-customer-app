# ZUUMCUSTOMER — App khách hàng ZuumViet

Luồng **khách hàng** (không phải tài xế):

1. Welcome → SĐT → OTP  
2. Nếu chưa có TK → đăng ký ngắn (họ tên + passcode, mã giới thiệu tuỳ chọn)  
3. Home: đặt giao hàng / xe / thợ / nhân công, mua vé xe đường dài  
4. Đơn hàng: xem / theo dõi realtime / huỷ / đánh giá  
5. Ví, hộp thư, cộng đồng, tài khoản  

## Chạy

```bash
npm install
cp .env.example .env   # EXPO_PUBLIC_API_URL=http://localhost:7100 (API zuumviet-platform)
npm start
```

## API

- API NestJS: repo `zuumviet-platform` (local `http://localhost:7100`, Swagger `/docs`).
- Hợp đồng kiểu dữ liệu: `services/zuum-api.ts` — **sinh tự động, không sửa tay**. Cập nhật bằng
  `./scripts/sync-api-client.sh` (đặt `ZUUM_PLATFORM_DIR` nếu repo platform không nằm ở `../../zuumviet-platform`).
- Mọi lời gọi API đi qua `services/zuum.ts` (`api('GET /v1/customer/orders/:id', { params: { id } })`): phiên đăng nhập,
  làm mới token, header `x-device-id`, lỗi `ZuumApiError`. Realtime: `services/realtime.ts` + `hooks/useRealtime.ts`.
