# Chạy NeonPlay miễn phí với GitHub Pages

Frontend dùng GitHub Pages; Express và SQL Server chạy trên máy Windows này. Cloudflare Quick Tunnel cung cấp địa chỉ HTTPS cho backend. Toàn bộ tính năng vẫn dùng backend và dữ liệu thật, không chuyển sang dữ liệu demo trong trình duyệt.

**Máy phải bật, không ngủ và có Internet.** Khi máy tắt hoặc tunnel dừng, giao diện trên GitHub Pages vẫn tải được nhưng chức năng dùng backend sẽ mất kết nối. Quick Tunnel dành cho thử nghiệm, không đảm bảo thời gian hoạt động; địa chỉ backend thay đổi mỗi lần chạy lại.

Địa chỉ frontend sau khi triển khai thành công: `https://carsickgecko.github.io/Game-store/`. Route dùng hash, ví dụ `/#/catalog`, để tải lại trang không bị lỗi 404 của Pages.

## Chuẩn bị một lần

1. Cài Node.js 24 LTS, chạy `npm ci` trong `client` và `server`.
2. SQL Server phải có database `GameStoreDB`. Backend đọc thông tin kết nối và JWT từ `server/.env`; tạo từ `server/.env.example` nếu chưa có. File `.env` được giữ riêng trên máy và không còn được Git theo dõi. SQL Server trên máy này chỉ nhận TCP qua localhost.
3. Đặt `cloudflared.exe` từ [Cloudflare](https://developers.cloudflare.com/tunnel/downloads/) tại `artifacts/public-host/cloudflared.exe`.
4. Cài [GitHub CLI](https://cli.github.com/) hoặc đặt bản portable tại `artifacts/public-host/github-cli/bin/gh.exe`, rồi chạy `gh auth login --hostname github.com --web` bằng tài khoản có quyền quản lý repository.
5. Đưa thay đổi lên nhánh `main`. Workflow cũ `azure-deploy.yml` được thay bằng `github-pages.yml` để các lần push tiếp theo không triển khai lên Azure.
6. Trong repository, mở **Settings → Pages → Build and deployment → Source → GitHub Actions**. Workflow cần quyền Pages và môi trường `github-pages` cho phép deploy từ `main`.

## Bật website

Nếu SQL Server đang dừng, mở ứng dụng **Services** và Start **SQL Server (MSSQLSERVER)**. Sau đó mở PowerShell tại thư mục project:

```powershell
pwsh -File ./scripts/start-free-hosting.ps1 -UpdateGitHub
```

Lệnh này chạy backend trên `127.0.0.1:5002`, mở tunnel HTTPS, cập nhật repository variable `VITE_API_URL` rồi chạy workflow GitHub Pages. Không cần mở cổng SQL hoặc cổng router ra Internet. Nếu máy chỉ có Windows PowerShell, có thể chạy file bằng `powershell -File` theo chính sách thực thi của máy.

Chờ workflow **Deploy frontend to GitHub Pages** hoàn thành trong tab **Actions**. Mỗi lần chạy lại tunnel cần build Pages lại để frontend nhận địa chỉ API mới. Trong lúc deploy, website có thể vẫn trỏ vào địa chỉ tunnel cũ.

Nếu chưa đăng nhập GitHub CLI, có thể chạy script không có `-UpdateGitHub`. Sao chép URL Backend in ra vào **Settings → Secrets and variables → Actions → Variables → VITE_API_URL**, rồi chọn **Actions → Deploy frontend to GitHub Pages → Run workflow**.

## Dừng website

```powershell
pwsh -File ./scripts/stop-free-hosting.ps1
```

Lệnh chỉ dừng backend và tunnel do script tạo. Nó không dừng SQL Server hoặc phiên phát triển ở cổng 5001/5173. Script không tự đăng ký khởi động cùng Windows. Không chạy nhiều phiên trên cùng cổng 5002.

## Kiểm tra và xử lý lỗi

- File trạng thái và URL hiện tại: `artifacts/public-host/hosting-state.json`.
- Log backend: `artifacts/public-host/backend.log` và `backend-error.log`.
- Log tunnel: `artifacts/public-host/tunnel-error.log`.
- Endpoint kiểm tra: `<Backend URL>/api/v1/health` phải trả `{"ok":true}`.
- Build Pages bắt buộc có URL API HTTPS hợp lệ; sẽ dừng nếu biến bị thiếu hoặc còn trỏ về localhost/Azure.
- Cookie đăng nhập công khai dùng `Secure`, `SameSite=None` và `Partitioned` để hỗ trợ phiên đăng nhập giữa GitHub Pages và backend. Trình duyệt chặn toàn bộ cookie vẫn có thể không giữ phiên.
- Thanh toán Stripe, AI và các tích hợp ngoài vẫn cần khóa API hợp lệ; chuyển hosting không thay thế các tài khoản dịch vụ này.

GitHub Pages phục vụ file tĩnh, không chạy Express/SQL Server. Xem [giới hạn GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) trước khi dùng website cho hoạt động thương mại. Với cửa hàng vận hành thực tế, cần hosting phù hợp và giấy phép SQL phù hợp thay cho mô hình phát triển trên PC này.

Tài liệu: [Vite trên GitHub Pages](https://vite.dev/guide/static-deploy), [Cloudflare Quick Tunnels](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/).
