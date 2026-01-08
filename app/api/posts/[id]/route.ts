import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Post from "@/models/Post";
import { currentUser } from "@clerk/nextjs/server";

// 1. LẤY DANH SÁCH (GET)
export async function GET() {
  try {
    await connectToDatabase();
    const posts = await Post.find().sort({ createdAt: -1 });
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi lấy bài viết" }, { status: 500 });
  }
}

// 2. TẠO MỚI (POST)
export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (user?.publicMetadata?.role !== 'admin') return NextResponse.json({ error: "Cấm" }, { status: 403 });

    const body = await request.json();
    await connectToDatabase();

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
    return NextResponse.json({ error: "Lỗi tạo bài" }, { status: 500 });
  }
}

// 3. CẬP NHẬT (PUT) - Mới thêm
export async function PUT(request: Request) {
    try {
        const user = await currentUser();
        if (user?.publicMetadata?.role !== 'admin') return NextResponse.json({ error: "Cấm" }, { status: 403 });

        const body = await request.json();
        const { _id, ...updateData } = body;

        await connectToDatabase();
        
        // Cập nhật theo ID
        const updatedPost = await Post.findByIdAndUpdate(_id, updateData, { new: true });
        
        return NextResponse.json(updatedPost);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Lỗi cập nhật" }, { status: 500 });
    }
}

// 4. XÓA (DELETE) - Mới thêm (Dùng ?id=...)
export async function DELETE(request: Request) {
    try {
        const user = await currentUser();
        if (user?.publicMetadata?.role !== 'admin') return NextResponse.json({ error: "Cấm" }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: "Thiếu ID" }, { status: 400 });

        await connectToDatabase();
        await Post.findByIdAndDelete(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Lỗi xóa" }, { status: 500 });
    }
}