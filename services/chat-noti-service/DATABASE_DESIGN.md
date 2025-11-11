# 🗄️ Database Design

## MongoDB Collections

Chat service sử dụng 2 collections chính trong MongoDB.

---

## 📊 Collection: `conversations`

### Purpose
Lưu trữ thông tin về các cuộc trò chuyện giữa 2 participants (user-user hoặc user-company).

### Schema
```javascript
{
  _id: ObjectId,
  participants: [
    {
      id: String,        // userId hoặc companyId
      type: String,      // 'user' hoặc 'company'
    }
  ],
  lastMessage: ObjectId,   // Reference to messages collection
  lastMessageAt: Date,     // Timestamp của message cuối
  unreadCount: Map<String, Number>,  // userId -> số message chưa đọc
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
```javascript
// Index 1: Tìm conversation theo participant
{ "participants.id": 1 }

// Index 2: Sort conversation theo thời gian
{ "lastMessageAt": -1 }
```

### Example Document
```json
{
  "_id": "65f1234567890abcdef12345",
  "participants": [
    {
      "id": "user123",
      "type": "user"
    },
    {
      "id": "company456",
      "type": "company"
    }
  ],
  "lastMessage": "65f1234567890abcdef12346",
  "lastMessageAt": "2024-01-01T10:30:00.000Z",
  "unreadCount": {
    "user123": 0,
    "company456": 3
  },
  "createdAt": "2024-01-01T09:00:00.000Z",
  "updatedAt": "2024-01-01T10:30:00.000Z"
}
```

### Business Rules
1. **Uniqueness**: Mỗi cặp participants chỉ có 1 conversation duy nhất
2. **Participants**: Luôn có đúng 2 participants
3. **UnreadCount**: Auto update khi send/read messages
4. **LastMessage**: Auto update khi có message mới

### Queries
```javascript
// Tìm conversation giữa 2 participants
db.conversations.find({
  participants: {
    $all: [
      { $elemMatch: { id: "user123", type: "user" } },
      { $elemMatch: { id: "user456", type: "user" } }
    ]
  }
})

// Lấy tất cả conversations của 1 user
db.conversations.find({
  "participants.id": "user123",
  "participants.type": "user"
}).sort({ lastMessageAt: -1 })

// Đếm unread conversations
db.conversations.countDocuments({
  "participants.id": "user123",
  "unreadCount.user123": { $gt: 0 }
})
```

---

## 💬 Collection: `messages`

### Purpose
Lưu trữ tất cả messages trong các conversations.

### Schema
```javascript
{
  _id: ObjectId,
  conversationId: ObjectId,  // Reference to conversations
  sender: {
    id: String,              // userId hoặc companyId
    type: String,            // 'user' hoặc 'company'
  },
  content: String,           // Nội dung message
  status: String,            // 'sent', 'delivered', 'read'
  readBy: [
    {
      participantId: String,
      readAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
```javascript
// Index 1: Query messages theo conversation
{ "conversationId": 1, "createdAt": -1 }

// Index 2: Tìm unread messages
{ "conversationId": 1, "readBy.participantId": 1 }
```

### Example Document
```json
{
  "_id": "65f1234567890abcdef12346",
  "conversationId": "65f1234567890abcdef12345",
  "sender": {
    "id": "user123",
    "type": "user"
  },
  "content": "Hello, how are you?",
  "status": "read",
  "readBy": [
    {
      "participantId": "company456",
      "readAt": "2024-01-01T10:31:00.000Z"
    }
  ],
  "createdAt": "2024-01-01T10:30:00.000Z",
  "updatedAt": "2024-01-01T10:31:00.000Z"
}
```

### Message Status Flow
```
sent → delivered → read
```

- **sent**: Message đã được gửi
- **delivered**: Message đã đến server (auto set)
- **read**: Cả 2 participants đã đọc

### Business Rules
1. **Sender**: Phải là 1 trong 2 participants của conversation
2. **ReadBy**: Không thể mark message của chính mình
3. **Status**: Auto update khi tất cả participants đã đọc
4. **Content**: Required, min 1 character

### Queries
```javascript
// Lấy messages của conversation
db.messages.find({
  conversationId: ObjectId("65f1234567890abcdef12345")
}).sort({ createdAt: -1 }).limit(50)

// Đếm unread messages
db.messages.countDocuments({
  conversationId: ObjectId("65f1234567890abcdef12345"),
  "sender.id": { $ne: "user123" },
  "readBy.participantId": { $ne: "user123" }
})

// Mark message as read
db.messages.updateOne(
  { _id: ObjectId("65f1234567890abcdef12346") },
  { 
    $push: { 
      readBy: { 
        participantId: "user123", 
        readAt: new Date() 
      } 
    } 
  }
)

// Lấy last message của conversation
db.messages.findOne({
  conversationId: ObjectId("65f1234567890abcdef12345")
}).sort({ createdAt: -1 })
```

---

## 🔗 Relationships

```
┌─────────────────┐
│  conversations  │
│                 │
│  _id            │◄──────┐
│  participants[] │       │
│  lastMessage ───┼───┐   │
│  lastMessageAt  │   │   │
│  unreadCount    │   │   │
└─────────────────┘   │   │
                      │   │
                      │   │ conversationId
                      │   │
                      ▼   │
              ┌─────────────────┐
              │    messages     │
              │                 │
              │  _id            │
              │  conversationId ├───┘
              │  sender         │
              │  content        │
              │  status         │
              │  readBy[]       │
              └─────────────────┘
```

### Foreign Keys
- `conversations.lastMessage` → `messages._id`
- `messages.conversationId` → `conversations._id`

---

## 📈 Data Flow

### 1. Create Conversation
```javascript
// Step 1: Check if conversation exists
const existing = await Conversation.findByParticipants(user1, user2);

// Step 2: Create if not exists
if (!existing) {
  await Conversation.create({
    participants: [user1, user2],
    unreadCount: { [user1.id]: 0, [user2.id]: 0 }
  });
}
```

### 2. Send Message
```javascript
// Step 1: Create message
const message = await Message.create({
  conversationId,
  sender: { id: userId, type: userType },
  content: "Hello!"
});

// Step 2: Update conversation
await Conversation.updateOne(
  { _id: conversationId },
  {
    lastMessage: message._id,
    lastMessageAt: new Date(),
    $inc: { [`unreadCount.${receiverId}`]: 1 }
  }
);

// Step 3: Emit socket event
io.to(conversationId).emit('new_message', { message });
```

### 3. Read Message
```javascript
// Step 1: Mark message as read
await message.markAsRead(userId);

// Step 2: Decrease unread count
await Conversation.updateOne(
  { _id: conversationId },
  { $inc: { [`unreadCount.${userId}`]: -1 } }
);

// Step 3: Emit socket event
io.to(conversationId).emit('message_read', { messageId, userId });
```

---

## 🎯 Performance Considerations

### 1. Pagination
Luôn sử dụng pagination và limit:
```javascript
// Good
db.messages.find({ conversationId })
  .sort({ createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(50)

// Bad - Load all messages
db.messages.find({ conversationId })
```

### 2. Indexes
Tất cả queries quan trọng đều có indexes:
- Tìm conversation by participant: ✅
- Sort conversation by time: ✅
- Query messages by conversation: ✅
- Count unread messages: ✅

### 3. Projection
Chỉ select fields cần thiết:
```javascript
// Good
db.conversations.find({}, { 
  participants: 1, 
  lastMessageAt: 1,
  unreadCount: 1 
})

// Bad - Load all fields
db.conversations.find({})
```

### 4. Aggregation
Sử dụng aggregation cho queries phức tạp:
```javascript
// Get conversations with unread count
db.conversations.aggregate([
  { $match: { "participants.id": "user123" } },
  {
    $lookup: {
      from: "messages",
      localField: "lastMessage",
      foreignField: "_id",
      as: "lastMessageData"
    }
  },
  { $unwind: "$lastMessageData" },
  { $sort: { lastMessageAt: -1 } }
])
```

---

## 🔒 Data Integrity

### Constraints
1. **Conversation**: 
   - Participants array must have exactly 2 items
   - Each participant must have id and type

2. **Message**:
   - conversationId must reference existing conversation
   - sender must be one of the conversation participants
   - content cannot be empty

### Cascading Deletes
Khi xóa conversation:
```javascript
// Delete conversation
await Conversation.findByIdAndDelete(conversationId);

// Delete all messages
await Message.deleteMany({ conversationId });
```

---

## 📊 Sample Queries

### Dashboard Statistics
```javascript
// Total conversations of user
db.conversations.countDocuments({
  "participants.id": "user123"
})

// Total unread messages
db.messages.countDocuments({
  "sender.id": { $ne: "user123" },
  "readBy.participantId": { $ne: "user123" }
})

// Most active conversations (last 7 days)
db.conversations.find({
  "participants.id": "user123",
  lastMessageAt: { 
    $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
  }
}).sort({ lastMessageAt: -1 }).limit(10)
```

### Search Messages
```javascript
// Search by content (requires text index)
db.messages.createIndex({ content: "text" })

db.messages.find({
  conversationId: ObjectId("..."),
  $text: { $search: "hello" }
})
```

---

## 🚀 Scaling Considerations

### Horizontal Scaling
- MongoDB supports sharding
- Shard key: `conversationId` for messages collection
- Keep conversations in single shard (small collection)

### Archiving
Archive old messages:
```javascript
// Move messages older than 1 year to archive collection
db.messages.aggregate([
  {
    $match: {
      createdAt: { 
        $lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) 
      }
    }
  },
  { $out: "messages_archive" }
])
```

### Caching Strategy
1. Cache user's conversation list (TTL: 5 minutes)
2. Cache recent messages (TTL: 1 minute)
3. Cache unread counts (Real-time update)

---

## 🛠️ Maintenance

### Backup
```bash
# Backup database
mongodump --db workly-chat --out /backup/$(date +%Y%m%d)

# Restore database
mongorestore --db workly-chat /backup/20240101/workly-chat
```

### Monitoring
Monitor these metrics:
- Collection sizes
- Index usage
- Slow queries (> 100ms)
- Connection pool usage

### Cleanup
```javascript
// Delete empty conversations (no messages)
db.conversations.deleteMany({
  lastMessage: { $exists: false }
})

// Delete orphaned messages (conversation deleted)
const conversationIds = db.conversations.distinct("_id");
db.messages.deleteMany({
  conversationId: { $nin: conversationIds }
})
```

---

## 📚 References

- [MongoDB Schema Design Best Practices](https://www.mongodb.com/developer/products/mongodb/schema-design-best-practices/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB Indexing Strategies](https://www.mongodb.com/docs/manual/indexes/)

---

Happy database designing! 🎉

