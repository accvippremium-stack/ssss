# E7 Web — bản thử nghiệm

Đây là trình duyệt điều khiển từ xa: Chromium chạy trên máy chủ, E7 nhận ảnh JPEG 360 × 480 và gửi thao tác bấm, cuộn, nhập chữ. Không phải Google Chrome cài trên Symbian. Giao diện dùng HTML và biểu mẫu, không cần JavaScript trên E7.

## Đưa lên mạng miễn phí

1. Tạo kho GitHub và tải các tệp trong thư mục này lên gốc kho.
2. Đăng nhập https://render.com và tạo Blueprint từ kho GitHub đó. Tệp render.yaml chọn gói Free.
3. Đợi triển khai hoàn tất. Trong phần Environment của dịch vụ, xem giá trị ACCESS_KEY đã được tạo. Giữ riêng mã này.
4. Mở URL HTTPS của dịch vụ trên E7, nhập ACCESS_KEY, nhập địa chỉ trang và bấm Mo.
5. Bấm trực tiếp vào ảnh để chọn liên kết hoặc ô nhập. Sau khi chọn ô nhập, điền chữ ở biểu mẫu bên dưới ảnh, bấm Nhap chu rồi Enter nếu cần. Cap nhat lấy ảnh mới; Xoa phien xóa cookie trang web của phiên Chromium.

Nếu Blueprint yêu cầu thanh toán, không xác nhận thanh toán. Có thể tạo Web Service với runtime Docker, chọn Free và tự đặt ACCESS_KEY dài ít nhất 16 ký tự. Nếu tài khoản không có tùy chọn Free, dừng ở đó.

Render Free tự ngủ sau 15 phút không có yêu cầu. Lần mở tiếp theo cần chờ khởi động; phiên trình duyệt bị mất khi máy chủ khởi động lại. Thông tin hiện tại: https://render.com/docs/free . Không dùng thủ thuật giữ máy chủ thức liên tục.

## Giới hạn cần kiểm tra trên máy thật

- Chưa triển khai, chưa kiểm thử Chromium trong Docker và chưa kiểm thử trên Nokia E7. Đã kiểm tra cú pháp JavaScript và đường đăng nhập bằng Node.
- E7 phải mở được HTTPS của máy chủ. Máy chủ không sửa được lỗi TLS/chứng chỉ giữa E7 và Render. Nếu trình duyệt E7 không mở được URL, cần trình duyệt Symbian tương thích hơn hoặc phương án khác; không tắt kiểm tra chứng chỉ.
- Không truyền video, âm thanh, tải tệp hoặc đa tab. Một phiên dùng chung cho người biết mã, nên chỉ dùng cá nhân. Một số trang chặn trình duyệt trên máy chủ hoặc yêu cầu CAPTCHA.
- RAM của gói miễn phí có thể không đủ cho trang nặng. Máy chủ nhìn thấy nội dung bạn truy cập và nhập; bản thử nghiệm không dành cho ngân hàng hay tài khoản nhạy cảm.
- Bộ lọc URL chặn một số địa chỉ nội bộ thông thường, nhưng không phải cơ chế chống SSRF hoàn chỉnh (DNS và chuyển hướng vẫn cần kiểm soát mạng). Chỉ chạy trong môi trường cô lập không có tài nguyên nội bộ hoặc thông tin xác thực cloud, và không chia sẻ mã truy cập công khai.

## Chạy trên máy tính để thử

Cài Node.js, chạy npm install rồi npx playwright install chromium. Trên PowerShell:

```powershell
$env:ACCESS_KEY = 'dat-ma-rieng-it-nhat-16-ky-tu'
npm start
```

Mở http://localhost:3000 . Đây chỉ là tùy chọn kiểm thử; khi triển khai trên Render không cần giữ máy tính bật.
