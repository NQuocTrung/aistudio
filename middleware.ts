import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 👇 Danh sách các trang CÔNG KHAI (Không cần đăng nhập vẫn vào được)
const isPublicRoute = createRouteMatcher([
  "/", 
  "/sign-in(.*)", 
  "/sign-up(.*)", 
  "/api/run",           // 👈 QUAN TRỌNG: Cho phép khách chạy AI
  "/api/posts",         // 👈 Cho phép khách đọc bài viết
  "/api/magic-prompt",  // 👈 Cho phép khách dùng Magic Prompt
  "/api/templates",     // 👈 Cho phép lấy mẫu
  "/sang-tao",          // 👈 Trang sáng tạo
  "/admin/login"        // 👈 Trang đăng nhập Admin
]);

export default clerkMiddleware((auth, req) => {
  // Nếu KHÔNG phải trang công khai thì mới bắt đăng nhập
  if (!isPublicRoute(req)) {
    // @ts-ignore
    auth().protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};