import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import { currentUser } from "@clerk/nextjs/server";

// 1. LẤY DANH SÁCH BÀI VIẾT (GET)
export async function GET() {
  try {
    await connectToDatabase();
    // Lấy tất cả bài viết, sắp xếp mới nhất lên đầu
    const posts = await Post.find().sort({ createdAt: -1 });
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi tải dữ liệu" }, { status: 500 });
  }
}

// 2. TẠO BÀI VIẾT MỚI (POST)
export async function POST(request: Request) {
  try {
    const user = await currentUser();
    // Kiểm tra quyền Admin
    if (!user || user.publicMetadata.role !== 'admin') {
        return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }

    const body = await request.json();
    await connectToDatabase();

    // Tự động tạo slug nếu chưa có
    let slug = body.slug;
    if (!slug) {
        slug = body.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, "-");
    }

    const newPost = await Post.create({
        ...body,
        slug,
        author: "Admin",
        createdAt: new Date()
    });

    return NextResponse.json(newPost);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi khi tạo bài" }, { status: 500 });
  }
}

// 3. CẬP NHẬT BÀI VIẾT (PUT) - Quan trọng để Sửa ảnh bìa
export async function PUT(request: Request) {
    try {
        const user = await currentUser();
        if (user?.publicMetadata?.role !== 'admin') return NextResponse.json({ error: "Cấm" }, { status: 403 });

        const body = await request.json();
        const { _id, ...updateData } = body; // Tách ID ra khỏi dữ liệu cần update

        if (!_id) return NextResponse.json({ error: "Thiếu ID bài viết" }, { status: 400 });

        await connectToDatabase();
        
        // Tìm bài viết theo ID và cập nhật dữ liệu mới
        const updatedPost = await Post.findByIdAndUpdate(_id, updateData, { new: true });
        
        return NextResponse.json(updatedPost);
    } catch (error) {
        console.error("Lỗi cập nhật:", error);
        return NextResponse.json({ error: "Lỗi cập nhật" }, { status: 500 });
    }
}

// 4. XÓA BÀI VIẾT (DELETE)
export async function DELETE(request: Request) {
    try {
        const user = await currentUser();
        if (user?.publicMetadata?.role !== 'admin') return NextResponse.json({ error: "Cấm" }, { status: 403 });

        // Lấy ID từ URL (vd: /api/posts?id=12345)
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: "Thiếu ID để xóa" }, { status: 400 });

        await connectToDatabase();
        await Post.findByIdAndDelete(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Lỗi khi xóa" }, { status: 500 });
    }
}