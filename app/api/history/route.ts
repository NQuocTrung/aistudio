import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import History from '@/models/History';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  try {
    // 1. Lấy thông tin người dùng
    const user = await currentUser();

   
    if (!user) {
      return NextResponse.json({ error: "Bạn chưa đăng nhập" }, { status: 401 });
    }

    // 2. Kết nối Database
    await connectToDatabase();

    // 3. Lấy danh sách lịch sử
   
    const histories = await History.find({ userId: user.id })
                                   .sort({ createdAt: -1 });

    return NextResponse.json(histories);

  } catch (error: any) {
    console.error("Lỗi API History:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}