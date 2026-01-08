import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import History from "@/models/History";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
  try {
    // 1. Kiểm tra quyền Admin
    const user = await currentUser();
    const isAdmin = user?.publicMetadata?.role === 'admin';

    if (!user || !isAdmin) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }

    await connectToDatabase();

    // 2. Thống kê số liệu
    const totalUsers = await User.countDocuments();
    const totalImages = await History.countDocuments();
    
    // Tính tổng số xu đang lưu hành (Của tất cả user cộng lại)
    const usersData = await User.find().select('credits');
    const totalCredits = usersData.reduce((acc, curr) => acc + (curr.credits || 0), 0);

    // 3. Lấy danh sách 20 user mới nhất
    const recentUsers = await User.find()
      .sort({ _id: -1 }) // Mới nhất lên đầu (Dựa vào ObjectId)
      .limit(20)
      .select('email credits clerkId'); // Chỉ lấy các trường cần thiết

    return NextResponse.json({
      stats: {
        users: totalUsers,
        images: totalImages,
        credits: totalCredits,
      },
      recentUsers
    });

  } catch (error: any) {
    console.error("Lỗi Admin Stats:", error);
    return NextResponse.json({ error: "Lỗi Server" }, { status: 500 });
  }
}