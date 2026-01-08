import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import History from '@/models/History';

// API này public, ai cũng gọi được
export async function GET() {
  try {
    await connectToDatabase();

    // Lấy các ảnh công khai, mới nhất lên đầu, giới hạn 50 ảnh
    const feed = await History.find({ isPublic: true })
                              .sort({ createdAt: -1 })
                              .limit(50) 
                              .select('resultImage prompt createdAt'); // Chỉ lấy các trường cần thiết cho nhẹ

    return NextResponse.json(feed);

  } catch (error: any) {
    console.error("Lỗi lấy feed:", error);
    // Trả về mảng rỗng nếu lỗi để frontend không bị crash
    return NextResponse.json([]);
  }
}