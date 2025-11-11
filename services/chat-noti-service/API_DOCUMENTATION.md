# 📚 API Documentation

Chi tiết đầy đủ về các API endpoints của Chat Service.

## Base URL
```
http://localhost:3003/api
```

## Authentication
Tất cả các endpoints (trừ health check) đều yêu cầu authentication headers:

```
Authorization: Bearer <token>
x-user-id: <userId>
x-user-type: user|company
```

---

## 🏥 Health Check

### GET /health
Kiểm tra trạng thái service.

**Response:**
```json
{
  "success": true,
  "message": "Chat service is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 💬 Conversations API

### 1. Create or Get Conversation
Tạo conversation mới hoặc lấy conversation đã tồn tại giữa 2 participants.

**Endpoint:** `POST /conversations`

**Headers:**
```
Authorization: Bearer <token>
x-user-id: user123
x-user-type: user
Content-Type: application/json
```

**Request Body:**
```json
{
  "participantId": "user456",
  "participantType": "user"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Conversation created successfully",
  "data": {
    "_id": "65f1234567890abcdef12345",
    "participants": [
      {
        "id": "user123",
        "type": "user"
      },
      {
        "id": "user456",
        "type": "user"
      }
    ],
    "unreadCount": {
      "user123": 0,
      "user456": 0
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 2. Get All Conversations
Lấy danh sách tất cả conversations của user hiện tại.

**Endpoint:** `GET /conversations`

**Query Parameters:**
- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số items per page (default: 20, max: 100)

**Example:**
```
GET /conversations?page=1&limit=20
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Conversations retrieved successfully",
  "data": [
    {
      "_id": "65f1234567890abcdef12345",
      "participants": [...],
      "lastMessage": {
        "_id": "65f1234567890abcdef12346",
        "content": "Hello!",
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      "lastMessageAt": "2024-01-01T00:00:00.000Z",
      "unreadCount": {
        "user123": 2
      }
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

### 3. Get Conversation by ID
Lấy chi tiết một conversation.

**Endpoint:** `GET /conversations/:id`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Conversation retrieved successfully",
  "data": {
    "_id": "65f1234567890abcdef12345",
    "participants": [...],
    "lastMessage": {...},
    "lastMessageAt": "2024-01-01T00:00:00.000Z",
    "unreadCount": {...}
  }
}
```

**Errors:**
- `404`: Conversation not found
- `403`: You are not a participant of this conversation

---

### 4. Delete Conversation
Xóa conversation và tất cả messages.

**Endpoint:** `DELETE /conversations/:id`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

**Errors:**
- `404`: Conversation not found
- `403`: You are not a participant of this conversation

---

## 📨 Messages API

### 1. Send Message
Gửi message mới trong conversation.

**Endpoint:** `POST /messages`

**Request Body:**
```json
{
  "conversationId": "65f1234567890abcdef12345",
  "content": "Hello, how are you?"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "_id": "65f1234567890abcdef12346",
    "conversationId": "65f1234567890abcdef12345",
    "sender": {
      "id": "user123",
      "type": "user"
    },
    "content": "Hello, how are you?",
    "status": "sent",
    "readBy": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Validation:**
- `content`: Required, min 1 character
- `conversationId`: Required, valid ObjectId

**Errors:**
- `404`: Conversation not found
- `403`: You are not a participant of this conversation

---

### 2. Get Messages
Lấy messages của một conversation.

**Endpoint:** `GET /messages/:conversationId`

**Query Parameters:**
- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số messages per page (default: 50, max: 100)

**Example:**
```
GET /messages/65f1234567890abcdef12345?page=1&limit=50
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Messages retrieved successfully",
  "data": [
    {
      "_id": "65f1234567890abcdef12346",
      "conversationId": "65f1234567890abcdef12345",
      "sender": {
        "id": "user123",
        "type": "user"
      },
      "content": "Hello!",
      "status": "read",
      "readBy": [
        {
          "participantId": "user456",
          "readAt": "2024-01-01T00:01:00.000Z"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  }
}
```

**Note:** Messages được sắp xếp từ cũ đến mới (ascending by createdAt).

---

### 3. Mark Message as Read
Đánh dấu một message đã đọc.

**Endpoint:** `PUT /messages/:messageId/read`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Message marked as read",
  "data": {
    "_id": "65f1234567890abcdef12346",
    "status": "read",
    "readBy": [
      {
        "participantId": "user456",
        "readAt": "2024-01-01T00:01:00.000Z"
      }
    ]
  }
}
```

**Errors:**
- `404`: Message not found
- `403`: You are not a participant of this conversation
- `400`: Cannot mark your own message as read

---

### 4. Mark All Messages as Read
Đánh dấu tất cả messages trong conversation đã đọc.

**Endpoint:** `PUT /messages/conversations/:conversationId/read-all`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "All messages marked as read"
}
```

**Note:** Chỉ đánh dấu messages của người khác (không phải của mình) là đã đọc.

---

## 🔌 Socket.io Events

### Client Authentication
Khi connect đến Socket.io server, cần gửi auth data:

```javascript
const socket = io('http://localhost:3003', {
  auth: {
    userId: 'user123',
    userType: 'user'
  }
});
```

---

### Events: Client → Server

#### 1. join_conversation
Join vào conversation room để nhận real-time updates.

**Emit:**
```javascript
socket.emit('join_conversation', {
  conversationId: '65f1234567890abcdef12345'
});
```

#### 2. leave_conversation
Leave conversation room.

**Emit:**
```javascript
socket.emit('leave_conversation', {
  conversationId: '65f1234567890abcdef12345'
});
```

#### 3. send_message
Gửi message real-time.

**Emit:**
```javascript
socket.emit('send_message', {
  conversationId: '65f1234567890abcdef12345',
  content: 'Hello, World!'
});
```

#### 4. typing
Báo hiệu đang typing.

**Emit:**
```javascript
socket.emit('typing', {
  conversationId: '65f1234567890abcdef12345'
});
```

#### 5. stop_typing
Báo hiệu ngừng typing.

**Emit:**
```javascript
socket.emit('stop_typing', {
  conversationId: '65f1234567890abcdef12345'
});
```

#### 6. mark_message_read
Đánh dấu message đã đọc real-time.

**Emit:**
```javascript
socket.emit('mark_message_read', {
  conversationId: '65f1234567890abcdef12345',
  messageId: '65f1234567890abcdef12346'
});
```

---

### Events: Server → Client

#### 1. new_message
Nhận message mới.

**Listen:**
```javascript
socket.on('new_message', (data) => {
  console.log('New message:', data.message);
  // data.message: Message object
  // data.conversationId: string
});
```

#### 2. user_online
User vừa online.

**Listen:**
```javascript
socket.on('user_online', (data) => {
  console.log('User online:', data.userId);
});
```

#### 3. user_offline
User vừa offline.

**Listen:**
```javascript
socket.on('user_offline', (data) => {
  console.log('User offline:', data.userId);
});
```

#### 4. user_typing
User đang typing.

**Listen:**
```javascript
socket.on('user_typing', (data) => {
  // data.conversationId: string
  // data.userId: string
  // data.isTyping: boolean
  if (data.isTyping) {
    console.log(`${data.userId} is typing...`);
  } else {
    console.log(`${data.userId} stopped typing`);
  }
});
```

#### 5. message_read
Message đã được đọc.

**Listen:**
```javascript
socket.on('message_read', (data) => {
  // data.conversationId: string
  // data.messageId: string
  // data.userId: string (who read it)
  // data.readAt: Date
  console.log(`Message ${data.messageId} read by ${data.userId}`);
});
```

#### 6. user_joined_conversation
User join conversation.

**Listen:**
```javascript
socket.on('user_joined_conversation', (data) => {
  console.log(`${data.userId} joined conversation ${data.conversationId}`);
});
```

#### 7. user_left_conversation
User left conversation.

**Listen:**
```javascript
socket.on('user_left_conversation', (data) => {
  console.log(`${data.userId} left conversation ${data.conversationId}`);
});
```

#### 8. error
Error từ server.

**Listen:**
```javascript
socket.on('error', (data) => {
  console.error('Socket error:', data.message);
});
```

---

## 🚨 Error Responses

Tất cả errors đều có format:

```json
{
  "success": false,
  "message": "Error message here",
  "stack": "Stack trace (only in development)"
}
```

### Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (no permission)
- `404`: Not Found
- `500`: Internal Server Error

---

## 📊 Data Models

### Participant
```typescript
{
  id: string;
  type: 'user' | 'company';
}
```

### Conversation
```typescript
{
  _id: string;
  participants: Participant[];
  lastMessage?: ObjectId;
  lastMessageAt?: Date;
  unreadCount: Map<userId, number>;
  createdAt: Date;
  updatedAt: Date;
}
```

### Message
```typescript
{
  _id: string;
  conversationId: ObjectId;
  sender: Participant;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  readBy: {
    participantId: string;
    readAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 💡 Best Practices

### 1. Pagination
Luôn sử dụng pagination cho list endpoints để tránh load quá nhiều data:
```
GET /conversations?page=1&limit=20
GET /messages/:conversationId?page=1&limit=50
```

### 2. Real-time Updates
- Sử dụng Socket.io cho real-time messaging
- Sử dụng REST API cho load history và operations khác

### 3. Message Status Flow
```
sent → delivered → read
```

### 4. Unread Count
- Tự động tăng khi gửi message
- Tự động giảm khi đánh dấu đã đọc
- Reset về 0 khi mark all as read

### 5. Typing Indicator
- Emit `typing` khi user bắt đầu type
- Emit `stop_typing` sau 1-2 giây không typing
- Hoặc khi gửi message

---

## 🔐 Security Notes

### Authentication
- JWT token sẽ được verify ở middleware (hiện tại đang mock)
- Socket.io authentication qua `handshake.auth`

### Authorization
- Chỉ participants mới được access conversation
- Không thể đọc message của conversation không phải của mình
- Không thể mark own message as read

### Rate Limiting
- Implement rate limiting ở API Gateway
- Giới hạn số message per user per minute

---

## 📈 Performance Tips

### Indexing
Database đã được tạo indexes cho:
- `participants.id`
- `lastMessageAt`
- `conversationId + createdAt`

### Caching
Consider implement caching cho:
- User conversations list
- Recent messages
- Unread counts

### Connection Pooling
MongoDB connection pool được manage tự động bởi Mongoose.

---

## 🧪 Testing Flow

### Complete Chat Flow
1. User A creates conversation with User B
2. User A and User B connect via Socket.io
3. Both users join conversation room
4. User A sends message
5. User B receives message real-time
6. User B marks message as read
7. User A receives read notification

### Example Test Script
```javascript
// User A
const socketA = io('http://localhost:3003', {
  auth: { userId: 'userA', userType: 'user' }
});

socketA.emit('join_conversation', { conversationId });
socketA.emit('send_message', { 
  conversationId, 
  content: 'Hello!' 
});

// User B
const socketB = io('http://localhost:3003', {
  auth: { userId: 'userB', userType: 'user' }
});

socketB.on('new_message', (data) => {
  console.log('Received:', data.message.content);
  
  socketB.emit('mark_message_read', {
    conversationId: data.conversationId,
    messageId: data.message._id
  });
});
```

---

Happy coding! 🎉

