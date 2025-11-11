# 🗄️ Database Scripts Guide

Hướng dẫn sử dụng các scripts để quản lý MongoDB database.

---

## 📋 Available Scripts

### 1. Auto Initialize (Tự động)
Service tự động khởi tạo database khi khởi động:

```bash
npm run dev
# hoặc
npm start
```

**Điều gì xảy ra:**
- ✅ Kết nối MongoDB
- ✅ Tạo database `workly-chat` nếu chưa có
- ✅ Tạo collections: `conversations`, `messages`
- ✅ Tạo indexes cho performance optimization
- ✅ Log kết quả initialization

---

### 2. Manual Initialize (Thủ công)
Khởi tạo database, collections và indexes một cách độc lập:

```bash
npm run init-db
```

**Use case:**
- Setup database trước khi chạy service
- Reset indexes
- Verify database structure
- CI/CD pipeline

**Output:**
```
Starting database initialization...
Connected to MongoDB: mongodb://localhost:27017/workly-chat
Current collections: none
✓ Created 'conversations' collection with validation
✓ Created 'messages' collection with validation
Creating indexes for 'conversations' collection...
✓ Created indexes for 'conversations' collection
Creating indexes for 'messages' collection...
✓ Created indexes for 'messages' collection

Database initialization completed successfully!
```

---

### 3. Seed Database (Dữ liệu mẫu)
Tạo dữ liệu mẫu để test:

```bash
npm run seed-db
```

**Dữ liệu được tạo:**
- 2 conversations:
  - User-User conversation
  - User-Company conversation
- 5 messages với các status khác nhau
- Unread counts
- Timestamps

**⚠️ Warning:** Script này sẽ **XÓA TẤT CẢ** dữ liệu hiện có!

**Output:**
```
Starting database seeding...
Connected to MongoDB
Cleared existing data
✓ Created sample conversations
✓ Created sample messages for conversation 1
✓ Created sample messages for conversation 2
✅ Database seeding completed successfully!

Summary:
- 2 conversations created
- 5 messages created
```

---

## 🔧 Database Structure

### Collections Created

#### 1. conversations
```javascript
{
  // Validation rules
  validator: {
    participants: {
      type: "array",
      minItems: 2,
      maxItems: 2
    }
  },
  
  // Indexes
  indexes: [
    { "participants.id": 1 },
    { "lastMessageAt": -1 }
  ]
}
```

#### 2. messages
```javascript
{
  // Validation rules
  validator: {
    conversationId: "objectId",
    sender: { required: ["id", "type"] },
    content: { minLength: 1 }
  },
  
  // Indexes
  indexes: [
    { conversationId: 1, createdAt: -1 },
    { conversationId: 1, "readBy.participantId": 1 },
    { "sender.id": 1 }
  ]
}
```

---

## 🚀 Common Workflows

### Fresh Start (Từ đầu)
```bash
# 1. Xóa database hiện có (nếu có)
mongosh "mongodb://localhost:27017/workly-chat" --eval "db.dropDatabase()"

# 2. Khởi tạo lại
npm run init-db

# 3. Seed dữ liệu mẫu
npm run seed-db

# 4. Chạy service
npm run dev
```

### Production Setup
```bash
# 1. Khởi tạo database
npm run init-db

# 2. Build & start (không seed dữ liệu mẫu)
npm run build
npm start
```

### Development with Sample Data
```bash
# 1. Seed dữ liệu mẫu
npm run seed-db

# 2. Chạy dev mode
npm run dev
```

### Reset Everything
```bash
# Option 1: Seed lại (clear + seed)
npm run seed-db

# Option 2: Drop database và init lại
mongosh "mongodb://localhost:27017/workly-chat" --eval "db.dropDatabase()"
npm run init-db
```

---

## 🔍 Verify Database

### Check Collections
```bash
mongosh "mongodb://localhost:27017/workly-chat" --eval "db.getCollectionNames()"
```

### Check Indexes
```bash
# Conversations indexes
mongosh "mongodb://localhost:27017/workly-chat" --eval "db.conversations.getIndexes()"

# Messages indexes
mongosh "mongodb://localhost:27017/workly-chat" --eval "db.messages.getIndexes()"
```

### Check Data
```bash
# Count documents
mongosh "mongodb://localhost:27017/workly-chat" --eval "
  print('Conversations:', db.conversations.countDocuments());
  print('Messages:', db.messages.countDocuments());
"

# View sample data
mongosh "mongodb://localhost:27017/workly-chat" --eval "
  db.conversations.find().limit(2).pretty();
  db.messages.find().limit(5).pretty();
"
```

---

## 📊 Index Details

### Conversations Indexes

| Index Name | Keys | Purpose |
|------------|------|---------|
| participants_id_index | `participants.id: 1` | Find conversations by participant |
| last_message_at_index | `lastMessageAt: -1` | Sort conversations by recent activity |

### Messages Indexes

| Index Name | Keys | Purpose |
|------------|------|---------|
| conversation_messages_index | `conversationId: 1, createdAt: -1` | Get messages by conversation, sorted |
| conversation_read_messages_index | `conversationId: 1, readBy.participantId: 1` | Count unread messages |
| sender_index | `sender.id: 1` | Find messages by sender |

---

## 🛠️ Troubleshooting

### Error: Cannot connect to MongoDB
```bash
# Check if MongoDB is running
docker ps | grep mongo

# Start MongoDB if not running
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

### Error: Collection already exists
```bash
# Drop collections và init lại
mongosh "mongodb://localhost:27017/workly-chat" --eval "
  db.conversations.drop();
  db.messages.drop();
"
npm run init-db
```

### Error: Index already exists with different options
```bash
# Drop indexes và tạo lại
mongosh "mongodb://localhost:27017/workly-chat" --eval "
  db.conversations.dropIndexes();
  db.messages.dropIndexes();
"
npm run init-db
```

### Permission denied
```bash
# Check MongoDB permissions
mongosh "mongodb://localhost:27017/workly-chat" --eval "db.runCommand({connectionStatus: 1})"
```

---

## 🔐 Production Considerations

### Security
- ✅ Sử dụng authentication trong production
- ✅ Không seed dữ liệu mẫu trong production
- ✅ Backup database trước khi chạy scripts
- ✅ Test scripts trong staging environment trước

### Backup Before Scripts
```bash
# Backup trước khi seed
mongodump --uri="mongodb://localhost:27017/workly-chat" --out=/backup/$(date +%Y%m%d)

# Restore nếu cần
mongorestore --uri="mongodb://localhost:27017/workly-chat" /backup/20240101/workly-chat
```

### CI/CD Integration
```yaml
# .github/workflows/deploy.yml
steps:
  - name: Initialize Database
    run: npm run init-db
    env:
      MONGODB_URI: ${{ secrets.MONGODB_URI }}
```

---

## 📝 Custom Scripts

### Create Your Own Seed Script
```typescript
// src/scripts/seed-custom.ts
import mongoose from "mongoose";
import { config } from "../config/environment";
import { Conversation, Message } from "../models";

const seedCustomData = async () => {
  await mongoose.connect(config.mongodb.uri);
  
  // Your custom seed logic here
  
  await mongoose.connection.close();
};

seedCustomData();
```

Add to package.json:
```json
{
  "scripts": {
    "seed-custom": "ts-node src/scripts/seed-custom.ts"
  }
}
```

---

## 📚 Related Documentation

- [Database Design](./DATABASE_DESIGN.md) - Schema và structure details
- [Quick Start](./QUICKSTART.md) - Getting started guide
- [README](./README.md) - Main documentation

---

## ❓ FAQ

**Q: Khi nào cần chạy init-db?**
A: Không bắt buộc vì service tự động init. Chỉ cần khi muốn setup trước hoặc reset indexes.

**Q: Seed data có tự động xóa data cũ không?**
A: Có! Script seed-db sẽ xóa toàn bộ data hiện có trước khi seed.

**Q: Có thể custom validation rules không?**
A: Có, edit file `src/scripts/init-database.ts` để thêm validation rules.

**Q: Indexes có được tạo lại mỗi khi restart service không?**
A: Có, nhưng MongoDB sẽ skip nếu index đã tồn tại (idempotent operation).

---

Happy database managing! 🎉

