import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"; // 👈 1. Import cái Menu vào

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Studio - Sáng tạo không giới hạn",
  description: "Tạo ảnh nghệ thuật bằng AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        
        {/* 👇 2. Đặt Navbar ở đây, nó sẽ hiện ở mọi trang */}
        <Navbar /> 
        
        {/* Đây là phần nội dung thay đổi (Trang chủ, Admin, Editor...) */}
        {children}
        
      </body>
    </html>
  );
}