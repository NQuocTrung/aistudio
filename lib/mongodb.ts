// lib/mongodb.ts
import mongoose from 'mongoose';

// Lấy chuỗi kết nối từ file .env.local
const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('⚠️ Chưa khai báo MONGODB_URI trong file .env.local');
}

// Cơ chế lưu cache để không bị tạo quá nhiều kết nối khi reload server
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("✅ Đã kết nối MongoDB thành công!");
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;