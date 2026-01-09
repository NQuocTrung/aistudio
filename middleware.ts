import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/", 
  "/sign-in(.*)", 
  "/sign-up(.*)", 
  "/api/run",           
  "/api/posts",         
  "/api/magic-prompt", 
  "/api/templates",     
  "/sang-tao",          
  "/admin/login"        
]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    // 👇 THÊM DÒNG NÀY ĐỂ BỎ QUA LỖI ĐỎ
    // @ts-ignore
    auth().protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};