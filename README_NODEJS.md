# PawHome - Node.js Version

โปรเจกต์ PawHome ได้ถูกแปลงจาก PHP เป็น **Node.js + Express** แล้ว! 🎉

## 📋 สิ่งที่เปลี่ยนแปลง

### Backend (PHP → JavaScript/Node.js)
- ✅ **Express.js** - Web framework สำหรับ Node.js
- ✅ **MySQL2** - Database driver พร้อม Promise support
- ✅ **JWT** - JSON Web Tokens สำหรับ authentication
- ✅ **bcryptjs** - Password hashing
- ✅ **CORS** - Cross-Origin Resource Sharing middleware

### API Routes ที่แปลงแล้ว
1. ✅ `/api/auth` - Authentication (login, register)
2. ✅ `/api/pets` - Pet management (CRUD operations)
3. ✅ `/api/matches` - Matching system
4. ✅ `/api/chat` - Messaging system
5. ✅ `/api/services` - Services management

## 🚀 วิธีการติดตั้งและรัน

### 1. ติดตั้ง Dependencies

```powershell
npm install
```

### 2. ตั้งค่า Environment Variables

แก้ไขไฟล์ `.env` ตามความเหมาะสม:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=pawhome_db
DB_PORT=3306

JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=24h
```

### 3. สร้าง/อัพเดต Database

ใช้ไฟล์ `database.sql` เพื่อสร้าง database และ tables:

```powershell
# ใน MySQL Command Line หรือ phpMyAdmin
mysql -u root -p pawhome_db < database.sql
```

### 4. รัน Server

#### Development Mode (แนะนำ - มี auto-reload)
```powershell
npm run dev
```

#### Production Mode
```powershell
npm start
```

Server จะรันที่: `http://localhost:3000`

### 5. เปิดเว็บไซต์

เปิดไฟล์ `index.html` ในเบราว์เซอร์ หรือใช้ Live Server

## 📁 โครงสร้างโปรเจกต์

```
PawHome/
├── config/
│   ├── config.js          # Configuration settings
│   └── database.js        # Database connection
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── pets.js            # Pet management routes
│   ├── matches.js         # Matching system routes
│   ├── chat.js            # Messaging routes
│   └── services.js        # Services routes
├── server.js              # Main Express application
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables
├── index.html             # Frontend HTML
├── app.js                 # Frontend JavaScript
├── styles.css             # Frontend CSS
└── database.sql           # Database schema
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - ล็อกอิน
- `POST /api/auth/register` - ลงทะเบียน
- `GET /api/auth/me` - ดึงข้อมูลผู้ใช้ปัจจุบัน

### Pets
- `GET /api/pets/list` - ดึงรายการสัตว์เลี้ยงทั้งหมด
- `GET /api/pets/get/:id` - ดึงข้อมูลสัตว์เลี้ยงตัวเดียว
- `POST /api/pets/add` - เพิ่มสัตว์เลี้ยงใหม่
- `PUT /api/pets/update/:id` - อัพเดตข้อมูลสัตว์เลี้ยง
- `DELETE /api/pets/delete/:id` - ลบสัตว์เลี้ยง
- `GET /api/pets/my-pets/:userId` - ดึงสัตว์เลี้ยงของผู้ใช้

### Matches
- `POST /api/matches/list` - ดึงรายการ matches
- `POST /api/matches/check` - ตรวจสอบและสร้าง match ใหม่
- `POST /api/matches/create` - สร้าง match โดยตรง
- `DELETE /api/matches/delete/:id` - ลบ match

### Chat
- `POST /api/chat/list` - ดึงข้อความทั้งหมด
- `POST /api/chat/send` - ส่งข้อความใหม่
- `POST /api/chat/mark-read` - ทำเครื่องหมายข้อความว่าอ่านแล้ว
- `DELETE /api/chat/delete/:id` - ลบข้อความ
- `GET /api/chat/unread-count/:userId` - นับจำนวนข้อความที่ยังไม่ได้อ่าน

### Services
- `GET /api/services/list` - ดึงรายการบริการทั้งหมด
- `POST /api/services/my-services` - ดึงบริการของผู้ใช้
- `POST /api/services/add` - เพิ่มบริการใหม่
- `PUT /api/services/update/:id` - อัพเดตบริการ
- `DELETE /api/services/delete/:id` - ลบบริการ
- `GET /api/services/by-category/:category` - ค้นหาบริการตามประเภท
- `GET /api/services/get/:id` - ดึงข้อมูลบริการตัวเดียว

## 🛠️ Development Commands

```powershell
# ติดตั้ง dependencies
npm install

# รัน development mode (มี auto-reload)
npm run dev

# รัน production mode
npm start

# ตรวจสอบว่า server ทำงานหรือไม่
curl http://localhost:3000/api/health
```

## ✨ Features

- ✅ RESTful API architecture
- ✅ JWT Authentication
- ✅ Password hashing ด้วย bcryptjs
- ✅ MySQL database connection pooling
- ✅ CORS enabled
- ✅ Error handling middleware
- ✅ Environment variables support
- ✅ Development และ Production modes

## 📝 หมายเหตุ

1. **Database**: โปรเจกต์ยังคงใช้ MySQL database เหมือนเดิม ไม่ต้องเปลี่ยนโครงสร้าง
2. **Frontend**: ไฟล์ HTML, CSS, และ JavaScript ถูกอัพเดตให้เรียก API endpoint ใหม่
3. **Port**: Server รันที่ port 3000 (แทนที่จะเป็น Apache/PHP)
4. **CORS**: ถูกเปิดใช้งานเพื่อให้ frontend เรียก API ได้

## 🐛 Troubleshooting

### ไม่สามารถเชื่อมต่อ Database
- ตรวจสอบว่า MySQL Server ทำงานอยู่
- ตรวจสอบ credentials ในไฟล์ `.env`
- ตรวจสอบว่า database `pawhome_db` ถูกสร้างแล้ว

### Port 3000 ถูกใช้งานอยู่
- เปลี่ยน PORT ในไฟล์ `.env`
- หรือปิดแอปพลิเคชันที่ใช้ port 3000 อยู่

### Module not found
- รัน `npm install` อีกครั้ง
- ลบ `node_modules` และ `package-lock.json` แล้วรัน `npm install` ใหม่

## 📞 Support

หากมีปัญหาหรือข้อสงสัย สามารถตรวจสอบ logs ใน console ได้ครับ!
