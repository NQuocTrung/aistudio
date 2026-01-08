import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { currentUser } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    await connectToDatabase();

    let user = await User.findOne({ clerkId: clerkUser.id });

    // 1. Nếu user chưa có trong DB -> Tạo mới
    if (!user) {
      user = await User.create({
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0].emailAddress,
        credits: 10, // Tặng 10 xu khởi nghiệp
        lastDailyBonus: new Date()
      });
    } else {
      // 2. Kiểm tra xem đã sang ngày mới chưa
      const now = new Date();
      // Nếu lastDailyBonus chưa có (data cũ), coi như là ngày hôm qua
      const lastBonus = user.lastDailyBonus ? new Date(user.lastDailyBonus) : new Date(0); 

      const isSameDay = 
          now.getDate() === lastBonus.getDate() &&
          now.getMonth() === lastBonus.getMonth() &&
          now.getFullYear() === lastBonus.getFullYear();

      if (!isSameDay) {
          //  BÙ ĐỦ 10 XU
          
          if (user.credits < 10) {
              // Nếu đang nghèo (dưới 10 xu) -> Bù cho đủ 10 xu
              user.credits = 10;
              console.log(`🎁 Đã bù đủ 10 xu hàng ngày cho ${user.email}`);
          } else {
              // Nếu đang giàu (>= 10 xu) -> Không cộng thêm
              console.log(`ℹ️ ${user.email} đang có ${user.credits} xu (>=10) nên không nhận bonus.`);
          }
          
          // Cập nhật ngày nhận thưởng là hôm nay
          user.lastDailyBonus = now;
          await user.save();
      }
    }

    return NextResponse.json({ credits: user.credits });

  } catch (error: any) {
    console.error("Lỗi Check User:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}