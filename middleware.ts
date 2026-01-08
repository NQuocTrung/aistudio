import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Định nghĩa các route cần Clerk bảo vệ (Sau này dùng để chặn khách vào xem History)
// Hiện tại chưa chặn gì, cứ để mảng rỗng hoặc định nghĩa sẵn
const isProtectedRoute = createRouteMatcher(['/history(.*)']); 

export default clerkMiddleware((auth, req) => {
  
  // ============================================================
  // 👇 PHẦN 1: LOGIC ADMIN CŨ CỦA BẠN (Đã được lồng vào đây)
  // ============================================================
  
  // 1. Kiểm tra xem có đang vào trang admin không
  if (req.nextUrl.pathname.startsWith('/admin')) {
    
    // Ngoại lệ: Cho phép vào trang login của admin mà không cần chặn
    if (req.nextUrl.pathname === '/admin/login') {
      return NextResponse.next();
    }

    // 2. Kiểm tra cookie 'admin_token'
    const token = req.cookies.get('admin_token');

    // 3. Nếu chưa có token -> Đá về trang đăng nhập admin
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }
  // ============================================================
  // 👆 HẾT PHẦN LOGIC CŨ
  // ============================================================


  // PHẦN 2: LOGIC CỦA CLERK (Tạm thời cho qua hết, chưa bắt đăng nhập)
  // Nếu sau này muốn bắt buộc đăng nhập mới xem được history, bỏ comment dòng dưới:
  // if (isProtectedRoute(req)) auth().protect();

  return NextResponse.next();
});

// 👇 CẤU HÌNH MỚI (QUAN TRỌNG)
// Clerk cần chạy trên toàn bộ website (để hiện Avatar ở trang chủ), 
// nên ta phải thay đổi matcher cũ '/admin/:path*' thành matcher chuẩn của Clerk.
export const config = {
  matcher: [
    // Bỏ qua các file tĩnh (ảnh, css...)
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Luôn chạy trên API và các route khác
    '/(api|trpc)(.*)',
  ],
};