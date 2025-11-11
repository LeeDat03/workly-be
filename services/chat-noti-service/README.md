# Chat & Notification Service

Service quản lý chat real-time với MongoDB, Express, Socket.io và TypeScript.

## Tính năng

### Chat 1-1
- Chat giữa User-User
- Chat giữa User-Company
- Status đã đọc/chưa đọc cho messages
- Real-time messaging với Socket.io
- Typing indicators
- Online/Offline status

### API Endpoints

#### Conversations
- `POST /api/conversations` - Tạo hoặc lấy conversation
- `GET /api/conversations` - Lấy danh sách conversations
- `GET /api/conversations/:id` - Lấy conversation theo ID
- `DELETE /api/conversations/:id` - Xóa conversation

#### Messages
- `POST /api/messages` - Gửi message
- `GET /api/messages/:conversationId` - Lấy messages của conversation
- `PUT /api/messages/:messageId/read` - Đánh dấu message đã đọc
- `PUT /api/messages/conversations/:conversationId/read-all` - Đánh dấu tất cả đã đọc

### Socket.io Events

#### Client → Server
- `join_conversation` - Join vào conversation room
- `leave_conversation` - Leave conversation room
- `send_message` - Gửi message real-time
- `typing` - Báo đang typing
- `stop_typing` - Báo ngừng typing
- `mark_message_read` - Đánh dấu đã đọc real-time

#### Server → Client
- `new_message` - Message mới
- `user_online` - User online
- `user_offline` - User offline
- `user_joined_conversation` - User join conversation
- `user_left_conversation` - User leave conversation
- `user_typing` - User đang typing
- `message_read` - Message đã được đọc
- `error` - Lỗi

## Database Schema

### Conversation Collection
```javascript
{
  participants: [
    { id: String, type: 'user' | 'company' }
  ],
  lastMessage: ObjectId (ref: Message),
  lastMessageAt: Date,
  unreadCount: Map<userId, count>,
  createdAt: Date,
  updatedAt: Date
}
```

### Message Collection
```javascript
{
  conversationId: ObjectId (ref: Conversation),
  sender: { id: String, type: 'user' | 'company' },
  content: String,
  status: 'sent' | 'delivered' | 'read',
  readBy: [
    { participantId: String, readAt: Date }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

## Setup & Installation

### 1. Install dependencies
```bash
cd services/chat-noti-service
npm install
```

### 2. Configure environment
Tạo file `.env` với nội dung:
```env
PORT=3003
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/workly-chat
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
JWT_SECRET=your-jwt-secret-key
```

### 3. Start MongoDB
Đảm bảo MongoDB đang chạy:
```bash
# Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Hoặc local MongoDB
mongod
```

### 4. Database Initialization

**Service tự động khởi tạo database khi khởi động:**
- ✅ Tạo database `workly-chat` nếu chưa có
- ✅ Tạo collections: `conversations`, `messages`
- ✅ Tạo indexes để tối ưu performance

**Hoặc khởi tạo thủ công (optional):**
```bash
# Khởi tạo database và indexes
npm run init-db

# Seed dữ liệu mẫu để test
npm run seed-db
```

📚 Xem thêm: [Database Scripts Guide](./DATABASE_SCRIPTS.md)

### 5. Run service

#### Development mode
```bash
npm run dev
```

#### Production mode
```bash
npm run build
npm start
```

## Testing với Postman/cURL

### 1. Tạo conversation
```bash
curl -X POST http://localhost:3003/api/conversations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -H "x-user-id: user123" \
  -H "x-user-type: user" \
  -d '{
    "participantId": "user456",
    "participantType": "user"
  }'
```

### 2. Gửi message
```bash
curl -X POST http://localhost:3003/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -H "x-user-id: user123" \
  -H "x-user-type: user" \
  -d '{
    "conversationId": "conversation_id_here",
    "content": "Hello, World!"
  }'
```

### 3. Lấy messages
```bash
curl -X GET "http://localhost:3003/api/messages/conversation_id_here?page=1&limit=50" \
  -H "Authorization: Bearer your-token" \
  -H "x-user-id: user123" \
  -H "x-user-type: user"
```

## Socket.io Client Example

Xem file `examples/socket-client.html` để test Socket.io connection.

## Project Structure

```
src/
├── config/           # Configuration files
│   ├── database.ts   # MongoDB connection
│   └── environment.ts # Environment variables
├── controllers/      # Request handlers
│   ├── conversation.controller.ts
│   └── message.controller.ts
├── middlewares/      # Express middlewares
│   ├── auth.middleware.ts
│   ├── errorHandler.middleware.ts
│   └── validation.middleware.ts
├── models/          # MongoDB models
│   ├── conversation.model.ts
│   └── message.model.ts
├── routes/          # API routes
│   ├── conversation.routes.ts
│   ├── message.routes.ts
│   └── index.ts
├── services/        # Business logic
│   ├── conversation.service.ts
│   └── message.service.ts
├── socket/          # Socket.io handlers
│   └── chat.socket.ts
├── types/           # TypeScript types
│   └── index.ts
├── utils/           # Utility functions
│   ├── ApiError.ts
│   └── logger.ts
├── validators/      # Request validation
│   └── chat.validator.ts
├── app.ts           # Express app setup
└── index.ts         # Entry point
```

## Authentication

Hiện tại service sử dụng mock authentication qua headers:
- `Authorization: Bearer <token>`
- `x-user-id: <userId>`
- `x-user-type: user|company`

Trong production, bạn cần implement JWT verification trong `auth.middleware.ts`.

## Integration với API Gateway

Service này nên được đặt sau API Gateway (Kong) để:
- Xác thực JWT token
- Rate limiting
- Load balancing
- API versioning

## Notes

- Socket.io authentication sử dụng `socket.handshake.auth`
- Unread count được tự động cập nhật khi gửi/đọc message
- Conversation tự động track last message và timestamp
- Support pagination cho conversations và messages

## Troubleshooting

### MongoDB connection error
- Kiểm tra MongoDB đang chạy
- Kiểm tra MONGODB_URI trong .env

### Socket.io connection error
- Kiểm tra CORS configuration
- Kiểm tra authentication headers

### Port already in use
- Thay đổi PORT trong .env
- Kill process đang sử dụng port: `npx kill-port 3003`

