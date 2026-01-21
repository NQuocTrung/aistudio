'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

export default function HistoryPage() {
  const { isSignedIn, user } = useUser();
  const [histories, setHistories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        setHistories(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, [isSignedIn]);

  //  Công khai/Riêng tư
  const togglePublic = async (historyId: string, index: number) => {
      try {
          const res = await fetch('/api/history/publish', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ historyId })
          });
          const data = await res.json();
          if (data.success) {
              
              const newHistories = [...histories];
              newHistories[index].isPublic = data.isPublic;
              setHistories(newHistories);
          } else {
              alert(data.error || "Lỗi khi thay đổi trạng thái");
          }
      } catch (e) {
          alert("Lỗi kết nối");
      }
  }

  if (!isSignedIn) return <div className="text-white p-10 text-center">Vui lòng đăng nhập để xem lịch sử.</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10 font-sans">
   
      <div className="flex items-center gap-4 mb-8">
         <Link href="/" className="text-2xl">←</Link>
         <h1 className="text-3xl font-bold">Lịch sử sáng tạo của {user?.firstName}</h1>
      </div>

      {loading ? (
         <div className="text-center text-gray-400 mt-20">Đang tải dữ liệu...</div>
      ) : histories.length === 0 ? (
         <div className="text-center text-gray-500 mt-20">Bạn chưa tạo bức ảnh nào.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {histories.map((item: any, index) => (
            <div key={item._id} className="bg-[#121212] rounded-xl overflow-hidden border border-gray-800 group relative">
              <img src={item.resultImage} alt="AI Result" className="w-full h-64 object-cover" />
              
           
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                 <div className="flex gap-2 w-full">
                     
                     <a href={item.resultImage} target="_blank" download className="bg-white/20 hover:bg-white/40 text-white p-2 rounded-lg flex-1 text-center text-sm backdrop-blur-sm">
                        ⬇️ Tải về
                     </a>
                     
                     
                     <button 
                        onClick={() => togglePublic(item._id, index)}
                        className={`p-2 rounded-lg flex-1 text-center text-sm backdrop-blur-sm transition-colors ${item.isPublic ? 'bg-green-500/80 hover:bg-green-600/80 text-white' : 'bg-gray-500/50 hover:bg-blue-500/80 text-gray-200'}`}
                     >
                        {item.isPublic ? '🌏 Đã Public' : '🔒 Riêng tư'}
                     </button>
                 </div>
              </div>
              
               {item.isPublic && <div className="absolute top-2 right-2 bg-green-500 text-xs px-2 py-1 rounded-full shadow-md">🌏 Công khai</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}