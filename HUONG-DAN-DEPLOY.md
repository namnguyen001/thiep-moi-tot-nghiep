# Hướng Dẫn Deploy Thiệp Mời Lên Render.com (Miễn Phí)

## Bước 1: Chuẩn bị GitHub
1. Tạo tài khoản GitHub tại https://github.com
2. Tạo repository mới (ví dụ: `thiep-moi-tot-nghiep`)
3. Upload toàn bộ code từ thư mục `d:/DoAn/TotNghiep` lên GitHub (trừ file `invitation.db`)

## Bước 2: Đăng ký Render.com
1. Truy cập https://render.com
2. Đăng ký tài khoản (dùng GitHub để đăng ký nhanh hơn)
3. Xác nhận email

## Bước 3: Tạo Web Service
1. Đăng nhập vào Render.com
2. Click vào "New +" → "Web Service"
3. Kết nối với GitHub repository của bạn
4. Cấu hình như sau:
   - **Name**: thiep-moi-tot-nghiep (hoặc tên bạn muốn)
   - **Region**: Singapore (gần Việt Nam nhất)
   - **Branch**: main
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

## Bước 4: Cấu hình Environment Variables (Quan trọng)
Trong phần "Environment Variables", thêm:
- **Key**: `PORT`
- **Value**: `8000`

## Bước 5: Deploy
1. Click "Create Web Service"
2. Chờ khoảng 2-5 phút để Render build và deploy
3. Sau khi hoàn thành, bạn sẽ nhận được URL public dạng: `https://thiep-moi-tot-nghiep.onrender.com`

## Bước 6: Sử dụng
- **Link thiệp**: `https://thiep-moi-tot-nghiep.onrender.com`
- **Link admin**: `https://thiep-moi-tot-nghiep.onrender.com/admin`
- **Mật khẩu admin**: 123456

## Lưu ý quan trọng:
- Database SQLite sẽ được tạo mới trên Render (không có dữ liệu từ local)
- Bạn cần tạo lại thiệp và upload ảnh qua trang admin
- Render miễn phí sẽ "ngủ" sau 15 phút không hoạt động và cần ~30s để khởi động lại
- Để tránh bị sleep, có thể dùng cron job hoặc upgrade lên gói trả phí ($7/tháng)

## Alternative: Railway.app
Nếu Render không hoạt động, có thể thử Railway.app:
1. https://railway.app
2. Quy trình tương tự, miễn phí $5/tháng
