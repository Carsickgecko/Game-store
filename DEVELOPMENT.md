# Chạy dự án trong VS Code

Môi trường local: Node.js 24 LTS và npm. Các thư viện được cài theo `package-lock.json` của từng thư mục.

## Chạy website

Trong VS Code, nhấn **Ctrl+Shift+P** → **Tasks: Run Task** → **Project: Run frontend + backend**.
Tác vụ mở hai terminal cho backend và frontend.

- Website: http://localhost:5173
- Backend: http://localhost:5001
- Kiểm tra API: http://localhost:5001/api/v1/health

Có thể chạy thủ công trong hai terminal:

```bat
cd server
npm run dev
```

```bat
cd client
npm run dev -- --host localhost --port 5173 --strictPort
```

Nếu dùng PowerShell và lệnh `npm` bị chặn bởi Execution Policy, dùng `npm.cmd`.
Terminal mặc định của workspace là Command Prompt và đã có đường dẫn Node.js.

## Cài lại thư viện và kiểm tra

Từ thư mục gốc:

```bat
npm --prefix client ci
npm --prefix server ci
npm --prefix client run build
npm --prefix client test
npm --prefix server test
```

## SQL Server local

Instance: `MSSQLSERVER`; database: `GameStoreDB`.
Ứng dụng dùng tài khoản `neonplay_app` trong `server/.env`, có quyền đọc/ghi dữ liệu.
SQL Server chỉ lắng nghe TCP 1433 trên localhost.

Dịch vụ đang đặt khởi động thủ công. Sau khi khởi động lại Windows, mở PowerShell bằng **Run as administrator** và chạy:

```powershell
Start-Service MSSQLSERVER
```

Tiện ích SQL Server trong VS Code có profile **GameStoreDB local (Windows)** dùng tài khoản Windows và kết nối nội bộ.
Profile không lưu mật khẩu. Tránh chạy đồng thời hai bộ frontend/backend trên cùng cổng.

## Tiện ích VS Code

Material Icon Theme, ESLint, Prettier, Tailwind CSS IntelliSense, ES7+ React snippets, SQL Server và REST Client.
Danh sách nằm trong `.vscode/extensions.json`; icon và formatter được cấu hình trong `.vscode/settings.json`.
Nếu biểu tượng chưa cập nhật, chạy **Developer: Reload Window** từ Command Palette.
