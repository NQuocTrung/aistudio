import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { currentUser, clerkClient } from "@clerk/nextjs/server";

// 1. LẤY DANH SÁCH NGƯỜI DÙNG
export async function GET() {
  try {
    const user = await currentUser();
    // Check quyền Admin
    if (user?.publicMetadata?.role !== 'admin') {
        return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    await connectToDatabase();
    // Lấy tất cả user, sắp xếp người mới nhất lên đầu
    const users = await User.find().sort({ createdAt: -1 });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi lấy danh sách user" }, { status: 500 });
  }
}

// 2. CẬP NHẬT NGƯỜI DÙNG (ROLE & CREDITS)
export async function PUT(request: Request) {
    try {
        const admin = await currentUser();
        if (admin?.publicMetadata?.role !== 'admin') return NextResponse.json({ error: "Cấm" }, { status: 403 });

        const body = await request.json();
        const { _id, clerkId, role, credits } = body;

        await connectToDatabase();
        
        // A. Cập nhật Database (Số xu)
        const updatedUser = await User.findByIdAndUpdate(_id, { creditBalance: credits }, { new: true });

        // B. Cập nhật Clerk (Quyền Admin)
        // Lưu ý: role phải là 'admin' hoặc 'member'
        const client = await clerkClient();
        await client.users.updateUserMetadata(clerkId, {
            publicMetadata: {
                role: role // 'admin' | 'member'
            }
        });
        
        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Lỗi cập nhật user" }, { status: 500 });
    }
}

// 3. XÓA NGƯỜI DÙNG
export async function DELETE(request: Request) {
    try {
        const admin = await currentUser();
        if (admin?.publicMetadata?.role !== 'admin') return NextResponse.json({ error: "Cấm" }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id'); // ID MongoDB
        const clerkId = searchParams.get('clerkId'); // ID Clerk

        if (!id || !clerkId) return NextResponse.json({ error: "Thiếu ID" }, { status: 400 });

        await connectToDatabase();
        
        // A. Xóa trong MongoDB
        await User.findByIdAndDelete(id);

        // B. Xóa trong Clerk (Để họ không đăng nhập được nữa)
        const client = await clerkClient();
        await client.users.deleteUser(clerkId);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Lỗi xóa user" }, { status: 500 });
    }
}