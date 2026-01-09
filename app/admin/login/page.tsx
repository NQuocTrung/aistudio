import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    // So sánh với mật khẩu trong Biến môi trường
    if (password === process.env.ADMIN_PASSWORD) {
      // Trả về thành công + Cookie (hoặc token đơn giản)
      const response = NextResponse.json({ success: true });
      
      // Lưu cookie để nhớ trạng thái admin (đơn giản hóa)
      response.cookies.set('admin_session', 'true', {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 // 1 ngày
      });
      
      return response;
    }

    return NextResponse.json({ error: "Sai mật khẩu" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi Server" }, { status: 500 });
  }
}