// app/api/templates/route.ts
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Template from '@/models/Template';

// 1. LẤY DANH SÁCH MẪU (Cho trang chủ dùng)
export async function GET() {
  try {
    await connectToDatabase();
    // Lấy tất cả mẫu, sắp xếp mới nhất lên đầu
    const templates = await Template.find({}).sort({ createdAt: -1 });
    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi lấy dữ liệu" }, { status: 500 });
  }
}

// 2. THÊM MẪU MỚI (Cho Admin dùng)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    await connectToDatabase();
    
    // Tạo mẫu mới trong Database
    const newTemplate = await Template.create(body);
    
    return NextResponse.json({ success: true, data: newTemplate });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Lỗi lưu Database" }, { status: 500 });
  }
}