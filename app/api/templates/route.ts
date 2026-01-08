import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Template from '@/models/Template';

// 1. LẤY MẪU (GET) - ĐÃ SỬA LOGIC LỌC THEO ID ✅
export async function GET(request: Request) {
  try {
    await connectToDatabase();

    // 👇 BƯỚC QUAN TRỌNG: Lấy tham số ID từ đường dẫn URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // 👉 TRƯỜNG HỢP A: Có ID -> Tìm đúng 1 cái mẫu đó thôi
      const template = await Template.findById(id);
      
      // Nếu không tìm thấy thì báo lỗi 404 (tùy chọn) hoặc trả về null
      if (!template) {
          return NextResponse.json({ error: "Không tìm thấy mẫu" }, { status: 404 });
      }
      
      return NextResponse.json(template);
    } else {
      // 👉 TRƯỜNG HỢP B: Không có ID -> Lấy tất cả (Dành cho trang chủ)
      const templates = await Template.find({}).sort({ createdAt: -1 });
      return NextResponse.json(templates);
    }

  } catch (error) {
    console.error("Lỗi GET:", error);
    return NextResponse.json({ error: "Lỗi lấy dữ liệu" }, { status: 500 });
  }
}

// 2. THÊM MẪU MỚI (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    await connectToDatabase();
    
    const newTemplate = await Template.create({
      name: body.name,
      category: body.category,
      label: body.label,
      color: body.color,
      modelId: body.modelId,       
      configParams: body.configParams, 
      description: body.description,
      mainImage: body.mainImage,
      variants: body.variants,
      isHot: body.isHot
    });

    return NextResponse.json({ success: true, data: newTemplate });
  } catch (error: any) {
    console.error("Lỗi POST:", error);
    return NextResponse.json({ error: "Lỗi lưu Database: " + error.message }, { status: 500 });
  }
}

// 3. CẬP NHẬT MẪU (PUT)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    await connectToDatabase();

    const { _id, ...updateData } = body; 

    if (!_id) {
        return NextResponse.json({ error: "Thiếu ID mẫu cần sửa" }, { status: 400 });
    }

    const updatedTemplate = await Template.findByIdAndUpdate(
      _id, 
      updateData, 
      { new: true } 
    );

    if (!updatedTemplate) {
      return NextResponse.json({ error: "Không tìm thấy mẫu này để sửa" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedTemplate });
  } catch (error: any) {
    console.error("Lỗi PUT:", error);
    return NextResponse.json({ error: "Lỗi cập nhật: " + error.message }, { status: 500 });
  }
}

// 4. XÓA MẪU (DELETE)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "Thiếu ID để xóa" }, { status: 400 });

    await connectToDatabase();
    await Template.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Đã xóa thành công!" });
  } catch (error: any) {
    return NextResponse.json({ error: "Lỗi khi xóa: " + error.message }, { status: 500 });
  }
}