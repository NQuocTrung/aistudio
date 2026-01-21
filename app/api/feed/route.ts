import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import History from '@/models/History';

// API này public, ai cũng gọi được
export async function GET() {
  try {
    await connectToDatabase();

    // Lấy các ảnh công khai, mới nhất lên đầu
    const feed = await History.find({ isPublic: true })
                              .sort({ createdAt: -1 })
                              .limit(50) 
                              .select('resultImage prompt createdAt'); 

    return NextResponse.json(feed);

  } catch (error: any) {
    console.error("Lỗi lấy feed:", error);

    return NextResponse.json([]);
  }
}