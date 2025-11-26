# ⚡ Quick Setup Guide - Chat Service

## 🚀 Setup trong 5 phút

### Bước 1: Cài Dependencies
```bash
cd services/chat-noti-service
yarn install
```

### Bước 2: Tạo file .env
```bash
cp .env.example .env
```

**Sửa file `.env`:**
```env
JWT_SECRET=iz8oygerT+M/EJAn5gAtVQ6IHEe+HRwoXUtFlIJBe1o=
```
⚠️ **Lấy JWT_SECRET từ admin/lead developer** (phải giống các service khác)

### Bước 3: Chọn môi trường

#### 🔷 Option A: Dev Mode (Dành cho developer)

**Yêu cầu:** MongoDB đang chạy local

```bash
# Start MongoDB nếu chưa có (dùng Docker)
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Chạy chat service
yarn dev
```

✅ Service chạy tại: `http://localhost:8005`

---

#### 🔶 Option B: Docker (Dành cho production-like)

```bash
# Start tất cả (chat service + MongoDB)
docker-compose up -d

# Xem logs
docker-compose logs -f
```

✅ Service chạy tại: `http://localhost:8005`

---

## ✅ Verify

### Test Health Check
```bash
curl http://localhost:8005/api/v1/health
```

**Response thành công:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Test Socket.io Connection

**Browser Console:**
```javascript
const socket = io('http://localhost:8005', {
  auth: { token: 'your-jwt-token' }
});
socket.on('connect', () => console.log('✅ Connected!'));
```

---

## 🔥 Common Issues

### ❌ Port 8005 already in use
```bash
# Windows
netstat -ano | findstr :8005
taskkill /F /PID <PID>
```

### ❌ MongoDB connection error
```bash
# Check MongoDB running
docker ps | grep mongo

# Or start it
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

### ❌ JWT verification failed
- Check `JWT_SECRET` trong `.env` **PHẢI GIỐNG** với `user-company-service`
- Lấy JWT_SECRET từ: `services/user-company-service/.env`

---

## 📊 So sánh 2 Options

| Feature | Dev Mode | Docker |
|---------|----------|--------|
| Setup | Nhanh | Trung bình |
| Auto-reload | ✅ Yes | ❌ No |
| MongoDB | Cần cài riêng | ✅ Tự động |
| Debug | ✅ Dễ | Khó hơn |
| Giống Production | Không | ✅ Gần giống |
| **Dùng khi** | **Đang code** | **Test production** |

---

## 🎯 Next Steps

1. ✅ Setup xong → Test API endpoints
2. ✅ Kết nối Frontend với Socket.io
3. ✅ Test send/receive messages
4. ✅ Check logs để debug

📖 **Chi tiết:** Xem `README.md`

---

**Done! Chat service đã sẵn sàng! 🎉**

