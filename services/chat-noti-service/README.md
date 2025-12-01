# Chat & Notification Service

Real-time chat service với MongoDB, Express, Socket.io và TypeScript.

## 📋 Prerequisites

- Node.js >= 18.x
- Yarn >= 1.22.x (hoặc npm)
- MongoDB (local hoặc Docker)

## 🚀 Quick Start

### 1. Clone và cài dependencies

```bash
# Di chuyển vào thư mục service
cd services/chat-noti-service

# Cài dependencies
yarn install
# hoặc: npm install
```

### 2. Setup Environment Variables

```bash
# Copy file .env.example thành .env
cp .env.example .env

# Sau đó sửa các giá trị trong file .env
```

**⚠️ QUAN TRỌNG:** File `.env` cần có các biến:

```env
# Server Configuration
PORT=8005
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/workly-chat

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000

# JWT Configuration
# ⚠️ JWT_SECRET PHẢI GIỐNG với các service khác trong hệ thống!
JWT_SECRET=your-jwt-secret-here
```

---

## 🔧 Chạy dự án - 2 Cách

### **Cách 1: Development Mode (Khuyến nghị cho dev)**

Chạy trực tiếp với nodemon (auto-reload):

```bash
# Cần MongoDB đang chạy ở localhost:27017
yarn dev
# hoặc: npm run dev
```

✅ **Ưu điểm:**
- Auto-reload khi code thay đổi
- Dễ debug
- Chạy nhanh

📌 **Yêu cầu:** MongoDB phải chạy local hoặc sửa `MONGODB_URI` trong `.env`

**Cài MongoDB local (nếu chưa có):**

**Windows:**
```bash
# Download từ: https://www.mongodb.com/try/download/community
# Hoặc dùng Docker:
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install mongodb-org
sudo systemctl start mongod
```

---

### **Cách 2: Docker (Khuyến nghị cho production)**

Chạy toàn bộ (chat service + MongoDB) trong Docker:

```bash
# Start containers
docker-compose up -d

# Xem logs
docker-compose logs -f chat-service

# Stop containers
docker-compose down
```

✅ **Ưu điểm:**
- Không cần cài MongoDB local
- Môi trường giống production
- Dễ deploy

⚠️ **Lưu ý:** File `.env` phải tồn tại với `JWT_SECRET`

---

## 🔌 Kết nối với Frontend

### Socket.IO Connection

**Frontend (Next.js/React):**

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:8005', {
  auth: {
    token: 'your-jwt-token',
    userId: 'user-id',
    userType: 'USER' // hoặc 'COMPANY'
  }
});

socket.on('connect', () => {
  console.log('Connected to chat service');
});
```

### REST API Endpoints

**Base URL:** `http://localhost:8005/api/v1`

**Conversations:**
- `GET /conversations` - Lấy danh sách conversations
- `POST /conversations` - Tạo conversation mới
- `DELETE /conversations/:id` - Xóa conversation

**Messages:**
- `GET /conversations/:id/messages` - Lấy messages
- `POST /conversations/:id/messages` - Gửi message
- `PUT /conversations/:id/messages/read` - Đánh dấu đã đọc

**Health Check:**
- `GET /api/v1/health` - Kiểm tra service hoạt động

---

## 🔐 JWT Secret Configuration

**QUAN TRỌNG:** `JWT_SECRET` phải **GIỐNG NHAU** giữa tất cả services:

```
workly-be/
├── services/
│   ├── user-company-service/.env
│   │   └── JWT_SECRET=same-secret-here
│   ├── post-hire-service/.env
│   │   └── JWT_SECRET=same-secret-here
│   └── chat-noti-service/.env
│       └── JWT_SECRET=same-secret-here  ✅
```

**Tại sao?**
- User đăng nhập qua `user-company-service` → tạo JWT token
- Token đó dùng để xác thực ở `chat-service`
- Nếu JWT_SECRET khác nhau → Token verification failed!

**Tạo JWT_SECRET mạnh:**
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# OpenSSL
openssl rand -base64 32
```

---

## 📝 Scripts

```bash
# Development (với nodemon)
yarn dev

# Build TypeScript
yarn build

# Production (sau khi build)
yarn start

# Docker
docker-compose up -d        # Start
docker-compose down         # Stop
docker-compose logs -f      # View logs
docker-compose restart      # Restart
```

---

## 🗄️ Database

### MongoDB Schema

**Conversations:**
```typescript
{
  participants: [{ id: string, type: 'USER' | 'COMPANY' }],
  lastMessage: Message,
  lastMessageAt: Date,
  unreadCount: { [participantId]: number },
  createdAt: Date,
  updatedAt: Date
}
```

**Messages:**
```typescript
{
  conversationId: string,
  sender: { id: string, type: 'USER' | 'COMPANY' },
  content: string,
  status: 'SENT' | 'DELIVERED' | 'READ',
  readBy: [{ participantId: string, readAt: Date }],
  createdAt: Date,
  updatedAt: Date
}
```

### Kết nối MongoDB

**Development:**
```env
MONGODB_URI=mongodb://localhost:27017/workly-chat
```

**Docker:**
```env
MONGODB_URI=mongodb://mongodb:27017/workly-chat
```

**MongoDB Atlas (Cloud):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/workly-chat
```

---

## 🐛 Troubleshooting

### Port 8005 đã được sử dụng

```bash
# Windows
netstat -ano | findstr :8005
taskkill /F /PID <PID>

# macOS/Linux
lsof -i :8005
kill -9 <PID>
```

### MongoDB connection failed

```bash
# Kiểm tra MongoDB đang chạy
# Windows/macOS
docker ps | grep mongo

# Linux
systemctl status mongod

# Test connection
mongosh mongodb://localhost:27017
```

### Socket.io không kết nối được

1. Kiểm tra `ALLOWED_ORIGINS` trong `.env` có đúng frontend URL
2. Verify JWT token còn hiệu lực
3. Check `JWT_SECRET` giống với service tạo token
4. Xem logs: `docker-compose logs -f` hoặc terminal đang chạy `yarn dev`

### Dependencies error

```bash
# Xóa node_modules và cài lại
rm -rf node_modules
yarn install

# Hoặc clean cache
yarn cache clean
yarn install
```

---

## 📦 Tech Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript 5.3
- **Framework:** Express 4.18
- **Database:** MongoDB 7.0 (Mongoose 8.0)
- **Real-time:** Socket.io 4.6
- **Validation:** Joi 17.11
- **Authentication:** JWT (jsonwebtoken 9.0)
- **Logging:** Winston 3.11
- **Dev Tools:** Nodemon, ts-node

---

## 🏗️ Project Structure

```
chat-noti-service/
├── src/
│   ├── config/          # Configuration (env, database)
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Auth, validation, error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── socket/          # Socket.io handlers
│   ├── types/           # TypeScript types
│   ├── utils/           # Utilities (logger, errors)
│   ├── validators/      # Joi schemas
│   ├── app.ts           # Express app setup
│   └── index.ts         # Entry point
├── docker-compose.yml   # Docker orchestration
├── Dockerfile           # Docker image build
├── package.json         # Dependencies
├── yarn.lock            # Locked dependencies
├── tsconfig.json        # TypeScript config
├── .env.example         # Environment template
└── README.md            # This file
```

---

## 🤝 Integration với hệ thống Workly

Chat service này là một phần của hệ thống Workly microservices:

```
┌─────────────────────┐
│ workly-frontend     │
│ (Next.js)           │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼────────┐ ┌──▼──────────────┐
│ user-       │ │ chat-noti-      │ ← You are here
│ company-    │ │ service         │
│ service     │ └─────────────────┘
│ (Auth)      │
└─────────────┘
    │
┌───▼────────┐
│ post-hire- │
│ service    │
└────────────┘
```

**Flow:**
1. User đăng nhập qua `user-company-service` → nhận JWT token
2. Frontend dùng token để kết nối Socket.io với `chat-noti-service`
3. Chat service verify token và thiết lập real-time connection

---

## 📄 License

ISC

## 👥 Contributors

- Your Team

---

## 📞 Support

Nếu gặp vấn đề, hãy:
1. Check logs: `docker-compose logs -f` hoặc terminal output
2. Verify `.env` config đúng
3. Đảm bảo MongoDB đang chạy
4. Check JWT_SECRET match với other services
5. Liên hệ team nếu vẫn không giải quyết được

---

**Happy Coding! 🚀**

