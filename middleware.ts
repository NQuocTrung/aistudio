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

// 👇 Thay đổi ở dòng này: thêm async và dùng auth.protect()
export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect(); 
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};