import type { Metadata } from "next";
import { Toaster } from 'sonner'; // ✅ Đã import
import { Inter } from "next/font/google"; 
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Studio - Sáng tạo ảnh vô tận",
  description: "Tạo ảnh AI, ghép mặt, làm nét ảnh chỉ trong 1 nốt nhạc.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="vi">
        <body className={inter.className}>
          {children}
          <Toaster position="top-center" richColors />
          
        </body>
      </html>
    </ClerkProvider>
  );
}