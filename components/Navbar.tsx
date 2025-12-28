'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  
  // Không hiện menu ở trang tạo ảnh để tập trung trải nghiệm
  // if (pathname.startsWith('/tao/')) return null;

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <Link href="/" className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-600">
          AI STUDIO
        </Link>

        {/* MENU ITEMS */}
        <div className="flex gap-6 items-center font-bold text-sm text-gray-300">
          <Link href="/" className={`hover:text-white transition ${pathname === '/' ? 'text-pink-500' : ''}`}>
            TRANG CHỦ
          </Link>
          
          <Link href="/about" className="hover:text-white transition">
            HƯỚNG DẪN
          </Link>

          {/* Nút Admin (Thực tế nên ẩn đi, nhưng ta để đây để bạn dễ vào) */}
          <Link href="/admin">
            <button className="bg-gray-800 px-4 py-2 rounded-full hover:bg-gray-700 border border-gray-700 transition">
              🔧 Quản trị
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
