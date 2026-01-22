# 🖼️ ตั้งค่า Cloudinary สำหรับ PawHome

## ทำไมต้องใช้ Cloudinary?
- ✅ **Render ลบไฟล์ที่อัปโหลด** เมื่อ restart/deploy ใหม่
- ✅ Cloudinary เก็บรูปถาวรบน cloud (ฟรี 25GB)
- ✅ ปรับขนาดรูปอัตโนมัติ (optimize)

---

## 📝 ขั้นตอนการตั้งค่า

### 1. สมัคร Cloudinary (ฟรี)
1. ไปที่: https://cloudinary.com/users/register_free
2. กรอกข้อมูล:
   - Email
   - Password
   - Cloud Name (เช่น `pawhome` - จำไว้)
3. ยืนยัน email

### 2. หา API Credentials
1. Login เข้า Cloudinary Dashboard
2. ไปที่ **Dashboard** → หน้าแรก
3. คัดลอก:
   - **Cloud Name**: `dxxxxx` (เช่น `pawhome`)
   - **API Key**: `123456789012345`
   - **API Secret**: `abcdefghijklmnopqrstuvwxyz`

### 3. เพิ่ม Environment Variables ใน Render
1. ไปที่ Render Dashboard: https://dashboard.render.com
2. เลือก Web Service: **pawhome**
3. ไปที่ **Environment** tab
4. กด **Add Environment Variable** แล้วเพิ่ม 3 ตัวนี้:

```
CLOUDINARY_CLOUD_NAME=pawhome
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
```

*(แทนค่าด้วยของคุณจาก Cloudinary Dashboard)*

### 4. Deploy ใหม่
1. Render จะ auto-deploy หลังเพิ่ม environment variables
2. หรือ Manual Deploy: กด **Manual Deploy** → **Deploy latest commit**

---

## ✅ ทดสอบ
1. เข้า https://pawhome.onrender.com
2. เข้าสู่ระบบ
3. เพิ่มสัตว์เลี้ยง → อัปโหลดรูป
4. รูปจะถูกเก็บที่ Cloudinary
5. URL จะเป็น: `https://res.cloudinary.com/pawhome/image/upload/...`

---

## 🔍 ตรวจสอบ Cloudinary
- ไปที่: https://cloudinary.com/console/media_library
- เห็นรูปที่อัปโหลดในโฟลเดอร์ `pawhome/pets/`

---

## 🚨 หมายเหตุ
- **ก่อน deploy** ต้องเพิ่ม environment variables ก่อน
- **ถ้าไม่ใส่** จะใช้ค่า demo (ไม่สามารถอัปโหลดได้)
