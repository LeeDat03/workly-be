# 🚀 Quick Start Guide

Hướng dẫn khởi chạy Chat Service nhanh chóng.

## Phương pháp 1: Docker Compose (Khuyên dùng) ⭐

Cách dễ nhất và nhanh nhất để chạy cả service và MongoDB.

### Bước 1: Chạy services
```bash
cd services/chat-noti-service
docker-compose up -d
```

### Bước 2: Kiểm tra logs
```bash
docker-compose logs -f chat-service
```

### Bước 3: Test service
```bash
curl http://localhost:3003/api/health
```

### Dừng services
```bash
docker-compose down
```

### Xóa hết data và restart lại từ đầu
```bash
docker-compose down -v
docker-compose up -d
```

---

## Phương pháp 2: Local Development

### Prerequisites
- Node.js 18+ 
- MongoDB 7.0+
- npm hoặc yarn

### Bước 1: Install dependencies
```bash
cd services/chat-noti-service
npm install
```

### Bước 2: Setup MongoDB

#### Option A: Docker
```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_DATABASE=workly-chat \
  mongo:7.0
```

#### Option B: Local MongoDB
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### Bước 3: Configure environment
Tạo file `.env`:
```bash
cp .env.example .env
```

Hoặc tạo file `.env` với nội dung:
```env
PORT=3003
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/workly-chat
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
JWT_SECRET=your-jwt-secret-key-here
```

### Bước 4: Initialize Database (Optional)
Database sẽ tự động khởi tạo khi service chạy, nhưng bạn có thể khởi tạo thủ công:

```bash
# Khởi tạo database, collections và indexes
npm run init-db

# Seed dữ liệu mẫu (để test)
npm run seed-db
```

### Bước 5: Run service
```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

**Note:** Service sẽ tự động:
- Tạo database nếu chưa có
- Tạo collections (conversations, messages)
- Tạo indexes để optimize performance

---

## 🧪 Testing

### 1. Health Check
```bash
curl http://localhost:3003/api/health
```

### 2. Tạo Conversation
```bash
curl -X POST http://localhost:3003/api/conversations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -H "x-user-id: user123" \
  -H "x-user-type: user" \
  -d '{
    "participantId": "user456",
    "participantType": "user"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Conversation created successfully",
  "data": {
    "_id": "...",
    "participants": [...],
    "unreadCount": {},
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### 3. Gửi Message
```bash
# Thay CONVERSATION_ID bằng ID từ bước 2
curl -X POST http://localhost:3003/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -H "x-user-id: user123" \
  -H "x-user-type: user" \
  -d '{
    "conversationId": "CONVERSATION_ID",
    "content": "Hello, World!"
  }'
```

### 4. Test Socket.io
Mở file `examples/socket-client.html` trong browser:
```bash
# Linux/macOS
open examples/socket-client.html

# Windows
start examples/socket-client.html
```

Hoặc với live server:
```bash
npx live-server examples
```

### 5. Import Postman Collection
- Mở Postman
- Import file `postman_collection.json`
- Update variables nếu cần
- Test các endpoints

---

## 📊 MongoDB GUI Tools

### MongoDB Compass (Khuyên dùng)
```
Connection String: mongodb://localhost:27017
Database: workly-chat
Collections: conversations, messages
```

Download: https://www.mongodb.com/products/compass

### VS Code Extension
- Install extension: "MongoDB for VS Code"
- Connect to: `mongodb://localhost:27017`

---

## 🔧 Troubleshooting

### Port already in use
```bash
# Kill process on port 3003
npx kill-port 3003

# Hoặc đổi port trong .env
PORT=3004
```

### MongoDB connection failed
```bash
# Kiểm tra MongoDB đang chạy
docker ps | grep mongo
# hoặc
mongosh --eval "db.version()"

# Restart MongoDB
docker restart mongodb
```

### TypeScript errors
```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build
```

### Socket.io không connect được
- Kiểm tra CORS settings trong `.env`
- Kiểm tra firewall
- Mở browser console để xem errors

---

## 📝 Next Steps

1. ✅ Service đang chạy
2. 📚 Đọc [README.md](README.md) để hiểu rõ hơn về API
3. 🧪 Test các endpoints với Postman
4. 🔌 Test Socket.io với example client
5. 🔗 Integrate với frontend application

---

## 🆘 Need Help?

- Check logs: `docker-compose logs -f`
- Check MongoDB: `docker exec -it workly-chat-mongodb mongosh workly-chat`
- Database console: `mongosh "mongodb://localhost:27017/workly-chat"`

Happy coding! 🎉

