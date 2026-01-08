import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    // 1. Kiểm tra đăng nhập
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Bạn chưa đăng nhập" }, { status: 401 });
    }

    // 2. Lấy thông tin gói nạp từ Frontend gửi lên
    const { amount, packageId } = await request.json();

    // 3. Kết nối Database
    await connectToDatabase();

    // 4. Cộng tiền cho User
    // Dùng $inc để cộng dồn, upsert: true để nếu chưa có user trong bảng User thì tạo mới luôn
    const updatedUser = await User.findOneAndUpdate(
      { clerkId: user.id },
      { 
        $inc: { credits: amount }, // Cộng thêm số xu
        $setOnInsert: { email: user.emailAddresses[0].emailAddress } // Nếu mới tạo thì lưu email
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({ 
      success: true, 
      newCredits: updatedUser.credits 
    });

  } catch (error: any) {
    console.error("Lỗi nạp tiền:", error);
    return NextResponse.json({ error: error.message || "Lỗi Server" }, { status: 500 });
  }
}