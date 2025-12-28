import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Kiểm tra xem người dùng có đang cố vào trang /admin không
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    // Ngoại lệ: Cho phép vào trang login của admin
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next();
    }

    // 2. Kiểm tra xem có cookie 'admin_token' chưa
    const token = request.cookies.get('admin_token');

    // 3. Nếu chưa có token -> Đá về trang đăng nhập
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  
  return NextResponse.next();
}

// Cấu hình: Chỉ chạy middleware trên các đường dẫn này
export const config = {
  matcher: '/admin/:path*',
};