import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import History from '@/models/History';
import User from '@/models/User'; // Import để populate thông tin người vẽ

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    // 1. Lấy từ khóa tìm kiếm từ URL (Ví dụ: /api/community?q=robot)
    const { searchParams } = new URL(request.url);
    const queryText = searchParams.get('q');

    // 2. Tạo bộ lọc
    let filter: any = {};
    
    // Chỉ lấy ảnh có đường dẫn hợp lệ
    filter.resultImage = { $ne: null }; 

    // Nếu có từ khóa -> Tìm trong prompt (không phân biệt hoa thường)
    if (queryText) {
        filter.prompt = { $regex: queryText, $options: 'i' };
    }

    // 3. Truy vấn DB
    const images = await History.find(filter)
      .sort({ createdAt: -1 }) // Mới nhất lên đầu
      .limit(50) // Tạm thời lấy 50 ảnh (Sau này làm Load more sẽ sửa số này)
      .populate('userId', 'email clerkId'); // Lấy thêm info người vẽ nếu cần

    return NextResponse.json({ images });

  } catch (error) {
    return NextResponse.json({ error: "Lỗi lấy dữ liệu" }, { status: 500 });
  }
}