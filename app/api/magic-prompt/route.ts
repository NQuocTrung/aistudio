import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Vui lòng nhập từ khóa" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Thiếu GEMINI_API_KEY" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // ✅ SỬ DỤNG MODEL MỚI NHẤT TỪ DANH SÁCH CỦA BẠN
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemInstruction = `
        Bạn là chuyên gia viết Prompt AI (Image Generation).
        Nhiệm vụ: Dựa trên ý tưởng sơ sài của người dùng, hãy viết lại thành một Prompt tiếng Anh chi tiết, chất lượng cao.
        Yêu cầu mô tả: Ánh sáng (Cinematic lighting), Phong cách (Realistic, 3D render, Anime...), Độ phân giải (8k, highly detailed), Góc máy.
        
        QUAN TRỌNG: Chỉ trả về nội dung prompt tiếng Anh. Không giải thích, không thêm lời dẫn.
        
        Ý tưởng gốc: "${prompt}"
    `;

    const result = await model.generateContent(systemInstruction);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ result: text.trim() });

  } catch (error: any) {
    console.error("❌ Lỗi Gemini:", error.message);
    return NextResponse.json({ error: "Lỗi xử lý AI: " + error.message }, { status: 500 });
  }
}