# Stripe thử nghiệm cho NeonPlay

Website dùng Stripe Checkout do Stripe host. Backend cần khóa **test/sandbox** `STRIPE_SECRET_KEY`, secret chữ ký `STRIPE_WEBHOOK_SECRET` và ID endpoint `STRIPE_WEBHOOK_ID`. Không cần đưa khóa bí mật hoặc khóa publishable vào frontend với luồng redirect hiện tại.

## Cấp khóa

Đăng nhập tài khoản/sandbox của bạn tại [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys). Lấy khóa test cho backend rồi đặt trực tiếp trong `server/.env`:

```dotenv
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_CURRENCY=usd
```

Giá trị trên chỉ là ví dụ, không phải khóa dùng được. Dùng khóa thật do Stripe cấp. Có thể dùng restricted key `rk_test_` nếu được cấp quyền Checkout Sessions, Products/Prices phục vụ Checkout và quản lý Webhook Endpoints. File `.env` chỉ lưu cục bộ và đã được Git bỏ qua.

Stripe CLI đã tải trên máy này tại `artifacts/stripe/cli/stripe.exe`. Cấu hình riêng của dự án nằm trong `artifacts/stripe/config.toml`, không commit. Khi CLI yêu cầu xác nhận thiết bị, mở liên kết Stripe cấp và nhập mã xác nhận trong trình duyệt.

Có thể dùng cửa sổ nhập khóa có che nội dung trên Windows:

```powershell
pwsh -STA -File scripts/set-stripe-test-key.ps1
```

Dán khóa test và chọn **Luu va cau hinh**. Công cụ lưu khóa riêng trên máy, tạo webhook và nạp lại backend tự động.

## Tạo webhook và nạp cấu hình

Khi hosting đang chạy, thực hiện từ thư mục gốc:

```powershell
node server/scripts/configure-stripe-webhook.mjs
pwsh -File scripts/restart-hosting-backend.ps1
```

Script tạo webhook **NeonPlay checkout (test)** tại `<URL tunnel>/api/v1/stripe/webhook`, lưu secret và ID vào `.env`, rồi lệnh thứ hai nạp lại backend mà không đổi URL tunnel. Script chỉ dùng khóa thử nghiệm và chỉ cập nhật endpoint mang metadata do NeonPlay tạo.

Các sự kiện đăng ký:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `payment_intent.payment_failed`

Khi chạy lại `scripts/start-free-hosting.ps1 -UpdateGitHub`, script tự cập nhật endpoint này sang URL tunnel mới. Không cần tạo webhook trùng lặp sau mỗi lần khởi động. Nếu cập nhật Stripe lỗi, script báo cảnh báo và vẫn giữ các tính năng khác của website chạy.

## Kiểm tra thanh toán

Chỉ thử trong sandbox/test mode. Dùng thẻ test Stripe `4242 4242 4242 4242`, ngày hết hạn trong tương lai và CVC gồm 3 chữ số. Sau khi trả về trang cảm ơn, kiểm tra đơn hàng chuyển sang completed, game vào Library và giỏ hàng được cập nhật. Không dùng thẻ thật trong test mode.

Khi hủy, website trở lại `/#/checkout?canceled=1&order_id=...`. Chữ ký webhook luôn được xác minh bằng secret của endpoint; không bỏ qua bước này.

Để nhận tiền thật cần tài khoản Stripe được kích hoạt, khóa live, webhook live và hạ tầng phù hợp. Script cấu hình tự động này không bật chế độ thu tiền thật.

Nguồn: [Stripe API keys](https://docs.stripe.com/keys), [Webhook endpoints](https://docs.stripe.com/api/webhook_endpoints/create), [Stripe testing](https://docs.stripe.com/testing).
