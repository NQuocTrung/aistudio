import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import History from '@/models/History';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  try {
    // 1. Kiểm tra chính chủ
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

    const { historyId } = await request.json();
    if (!historyId) return NextResponse.json({ error: "Thiếu ID ảnh" }, { status: 400 });

    await connectToDatabase();

    // 2. Tìm ảnh trong DB 
    const historyItem = await History.findOne({ _id: historyId, userId: user.id });

    if (!historyItem) {
      return NextResponse.json({ error: "Không tìm thấy ảnh hoặc bạn không có quyền." }, { status: 404 });
    }

    // 3. Đảo ngược trạng thái
    historyItem.isPublic = !historyItem.isPublic;
    await historyItem.save();

    return NextResponse.json({ success: true, isPublic: historyItem.isPublic });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}