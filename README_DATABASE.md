# วิธีเชื่อมต่อ PawHome กับ MySQL Database ผ่าน XAMPP

## ขั้นตอนการติดตั้ง:

### 1. เปิด XAMPP
- เปิด XAMPP Control Panel
- กด Start ที่ Apache และ MySQL

### 2. สร้าง Database
- เปิดเบราว์เซอร์แล้วไปที่ http://localhost/phpmyadmin
- คลิก "New" เพื่อสร้าง database ใหม่
- กด Import และเลือกไฟล์ `database.sql`
- หรือคัดลอกโค้ดใน `database.sql` แล้ววางใน SQL tab แล้วกด Go

### 3. ย้ายไฟล์โปรเจกต์
- คัดลอกโฟลเดอร์ PawHome2 ทั้งหมด
- วางใน C:\xampp\htdocs\
- ถ้าอยู่ใน OneDrive อยู่แล้ว ให้สร้าง symbolic link:
  ```
  mklink /D C:\xampp\htdocs\PawHome2 "C:\Users\suwat\OneDrive\เดสก์ท็อป\PawHome2"
  ```

### 4. ตรวจสอบการตั้งค่า Database
- เปิดไฟล์ `config.php`
- ตรวจสอบการตั้งค่า:
  - DB_HOST: 'localhost'
  - DB_USER: 'root'
  - DB_PASS: '' (ปล่อยว่างสำหรับ XAMPP)
  - DB_NAME: 'pawhome_db'

### 5. เปิดเว็บไซต์
- เปิดเบราว์เซอร์แล้วไปที่: http://localhost/PawHome2/
- ทดสอบล็อกอิน:
  - Username: admin
  - Password: password (รหัสผ่านตัวอย่าง)

## โครงสร้างไฟล์:

```
PawHome2/
├── index.html          (หน้าแรก)
├── styles.css          (CSS)
├── app.js             (JavaScript - ต้องแก้ไขให้เรียก API)
├── config.php         (การเชื่อมต่อ Database)
├── database.sql       (โครงสร้าง Database)
└── api/
    ├── auth.php       (API สำหรับล็อกอิน/ลงทะเบียน)
    └── pets.php       (API สำหรับจัดการสัตว์เลี้ยง)
```

## ขั้นตอนถัดไป:

### ต้องแก้ไข app.js ให้เรียกใช้ API แทน localStorage:

**เดิม (localStorage):**
```javascript
localStorage.setItem('user', JSON.stringify(user));
```

**ใหม่ (API):**
```javascript
fetch('http://localhost/PawHome2/api/auth.php?action=login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username, password})
})
.then(res => res.json())
.then(data => {
    if(data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        showApp();
    }
});
```

## ทดสอบ API:

### ทดสอบการล็อกอิน:
```
POST http://localhost/PawHome2/api/auth.php?action=login
Body: {"username": "admin", "password": "password"}
```

### ทดสอบดึงรายการสัตว์:
```
GET http://localhost/PawHome2/api/pets.php?action=list
```

## ปัญหาที่อาจพบ:

1. **CORS Error**: ตรวจสอบว่า config.php มี Header CORS
2. **Database Connection Failed**: ตรวจสอบ XAMPP MySQL ว่าเปิดอยู่
3. **404 Not Found**: ตรวจสอบว่าไฟล์อยู่ใน htdocs
4. **Password ไม่ตรง**: ใช้ password_hash() ในการเข้ารหัส

## ต้องการให้ช่วยแก้ไข app.js ให้เชื่อมกับ API หรือไม่?
