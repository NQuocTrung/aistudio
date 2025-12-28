import { NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN, // Dùng biến môi trường cho bảo mật
});

export async function POST(request: Request) {
  try {
    // 1. Nhận dữ liệu ĐỘNG từ Frontend (để chạy được cả Ghép mặt, Làm nét...)
    // Thay vì fix cứng targetUrl/swapUrl, ta nhận nguyên cục input
    const { model, input } = await request.json();

    console.log("--- BẮT ĐẦU GỌI AI ---");
    console.log("Model:", model);
    
    // 2. Gọi Replicate bằng hàm .run() (Đúng chuẩn code hồi tối)
    const output: any = await replicate.run(
      model, // Model động (Frontend gửi gì chạy nấy)
      { input: input } // Input động
    );

    console.log("Kết quả thô từ AI:", output);

    // === 👇 BỘ LỌC LINK THÔNG MINH (CODE CỦA BẠN - GIỮ NGUYÊN) 👇 ===
    let finalUrl = null;

    // Trường hợp 1: Nó là chuỗi link trực tiếp (hoặc đối tượng FileOutput đặc biệt)
    // Đây là dòng quan trọng nhất giúp fix lỗi ReadableStream
    if (output && output.toString().startsWith("http")) {
        finalUrl = output.toString();
    }
    // Trường hợp 2: Nó là danh sách (Array)
    else if (Array.isArray(output) && output.length > 0) {
        finalUrl = output[0].toString();
    }
    // Trường hợp 3: Nó là Object (có key image hoặc output)
    else if (typeof output === 'object') {
        finalUrl = output.image || output.output || output.url;
    }

    // Nếu vẫn chưa bắt được link, in lỗi ra để xem nó là cái gì
    if (!finalUrl) {
        console.error("Không tìm thấy link trong:", output);
        return NextResponse.json({ 
            // Trả về nguyên văn cái AI gửi để mình nhìn thấy trên web
            error: "Dữ liệu lạ từ AI: " + JSON.stringify(output) 
        }, { status: 500 });
    }

    console.log("✅ Link ảnh cuối cùng:", finalUrl);
    return NextResponse.json({ result: finalUrl });

  } catch (error: any) {
    console.error("Lỗi:", error);
    return NextResponse.json({ error: error.message || "Lỗi xử lý" }, { status: 500 });
  }
}