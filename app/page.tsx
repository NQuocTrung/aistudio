'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Định nghĩa kiểu dữ liệu cho Template
interface Template {
  _id: string;
  name: string;
  desc: string;
  mainImage: string;
  category: string;
  isHot: boolean;
}

export default function Home() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Gọi API lấy danh sách mẫu từ Database
    fetch('/api/templates')
      .then((res) => res.json())
      .then((data) => {
        setTemplates(data);
        setLoading(false);
      })
      .catch((err) => console.error("Lỗi tải trang:", err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-pink-500 selection:text-white">
      
      {/* HEADER */}
      <header className="border-b border-gray-800 p-6 sticky top-0 bg-gray-950/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-600 cursor-pointer">
            AI STUDIO
          </h1>
          <Link href="/admin">
            <button className="bg-gray-800 text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-gray-700 transition-colors border border-gray-700">
              ⚙️ Admin
            </button>
          </Link>
        </div>
      </header>

      {/* BANNER */}
      <div className="text-center py-20 px-4">
        <h2 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
          Sáng tạo ảnh <br /> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">bằng AI cực chất</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
          Chọn một mẫu bên dưới và để trí tuệ nhân tạo biến hóa bức ảnh của bạn trong tích tắc.
        </p>
      </div>

      {/* DANH SÁCH MẪU (GALLERY) */}
      <main className="max-w-7xl mx-auto px-6 pb-20">
        
        {loading ? (
          <div className="text-center text-gray-500">⏳ Đang tải danh sách mẫu...</div>
        ) : templates.length === 0 ? (
          <div className="text-center p-10 border border-dashed border-gray-800 rounded-xl">
            <p className="text-xl text-gray-500">Chưa có mẫu nào.</p>
            <p className="text-sm text-gray-600 mt-2">Hãy vào trang Admin để thêm mẫu mới nhé!</p>
            <Link href="/admin" className="text-blue-500 underline mt-2 block">Go to Admin</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {templates.map((t) => (
              <Link key={t._id} href={`/tao/${t._id}`} className="group">
                <div className="relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-pink-500 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-pink-500/20 aspect-[3/4]">
                  
                  {/* Ảnh thumbnail */}
                  <img 
                    src={t.mainImage} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    alt={t.name}
                  />
                  
                  {/* Lớp phủ đen mờ */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Thông tin */}
                  <div className="absolute bottom-0 inset-x-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    <p className="font-bold text-white text-lg truncate">{t.name}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-300 bg-gray-800/80 px-2 py-1 rounded backdrop-blur-sm">
                        {t.category === 'swap' ? '🎭 Ghép mặt' : '✨ Làm nét'}
                      </span>
                    </div>
                  </div>

                  {/* Badge HOT */}
                  {t.isHot && (
                    <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse shadow-lg">
                      HOT 🔥
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}