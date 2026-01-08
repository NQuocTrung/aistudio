'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

// --- CẤU HÌNH MENU DANH MỤC ---
const MODES = [
  { id: 'text-to-image', name: 'Tạo ảnh từ chữ', icon: '✨', desc: 'Nhập mô tả để AI vẽ tranh' },
  { id: 'nano-banana', name: 'Google Nano (VIP)', icon: '🍌', desc: 'Sửa ảnh thông minh (Hỗ trợ nhiều ảnh)' },
  { id: 'image-to-image', name: 'Biến đổi ảnh (SDXL)', icon: '🖼️', desc: 'Thay đổi phong cách (1 ảnh gốc)' },
  { id: 'upscale', name: 'Làm nét ảnh', icon: '🔍', desc: 'Tăng độ phân giải ảnh mờ' },
  { id: 'remove-bg', name: 'Tách nền', icon: '✂️', desc: 'Xóa phông nền tự động' },
];

// 👇 Cập nhật Interface: Thêm 'content' để đọc nội dung
interface Post {
  _id: string;
  title: string;
  excerpt: string;
  thumbnail: string;
  content?: string; 
}

export default function CreativePage() {
  const { user } = useUser();
  const [mode, setMode] = useState('text-to-image');
  
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // State cho Blog
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // 👇 STATE MỚI: Bài viết đang xem (để hiện Modal đọc)
  const [viewingPost, setViewingPost] = useState<Post | null>(null);

  // Load bài viết
  useEffect(() => {
    fetch('/api/posts')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) setPosts(data);
            setLoadingPosts(false);
        })
        .catch(() => setLoadingPosts(false));
  }, []);

  // 1. Hàm chuyển file sang Base64
  const filesToBase64 = async (files: File[]): Promise<string[]> => {
    const promises = files.map(file => 
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      })
    );
    return Promise.all(promises);
  };

  // 2. Xử lý upload ảnh
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const newFiles = Array.from(e.target.files);
          if (newFiles.length > 5) {
              toast.warning("Bạn chỉ nên chọn tối đa 5 ảnh thôi nhé!");
              return;
          }
          setSelectedImages(newFiles);
          const newPreviews = newFiles.map(file => URL.createObjectURL(file));
          setImagePreviews(newPreviews);
      }
  };

  // 3. Tạo ảnh
  const handleGenerate = async () => {
    if (mode === 'text-to-image' && !prompt) return toast.warning('Vui lòng nhập mô tả ý tưởng!');
    if (mode !== 'text-to-image' && selectedImages.length === 0) return toast.warning('Vui lòng chọn ít nhất 1 ảnh!');

    setLoading(true);
    setResult(null);
    const toastId = toast.loading("Đang kết nối với AI..."); 

    try {
        let base64Images: string[] = [];
        if (mode !== 'text-to-image' && selectedImages.length > 0) {
            base64Images = await filesToBase64(selectedImages);
        }

        const res = await fetch('/api/run', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                prompt, 
                aspectRatio: "1:1",
                mode: mode,
                images: base64Images
            })
        });
        
        const data = await res.json();
        toast.dismiss(toastId);

        if (data.result) {
            setResult(data.result);
            toast.success("Tạo ảnh thành công!"); 
        } else {
            toast.error(data.error || "Không tạo được ảnh");
        }
    } catch (error) {
        console.error(error);
        toast.dismiss(toastId);
        toast.error("Có lỗi kết nối đến server");
    } finally {
        setLoading(false);
    }
  };

  const handleDownload = async (url: string) => {
    const toastId = toast.loading("Đang tải ảnh về...");
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `QT-Studio-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.dismiss(toastId);
      toast.success("Đã tải xong!");
    } catch (error) {
      console.error("Lỗi tải ảnh:", error);
      toast.dismiss(toastId);
      window.open(url, '_blank');
    }
  };

  const handleMagicPrompt = async () => {
      if (!prompt.trim()) return toast.warning("Nhập từ khóa trước khi dùng Magic Prompt!");
      const oldPrompt = prompt;
      setPrompt("✨ AI đang suy nghĩ...");
      toast.info("Đang tối ưu câu lệnh...");
      try {
          const res = await fetch('/api/magic-prompt', {
              method: 'POST',
              body: JSON.stringify({ prompt: oldPrompt })
          });
          const data = await res.json();
          if (data.result) {
              setPrompt(data.result);
              toast.success("Đã tối ưu xong!");
          } else {
              setPrompt(oldPrompt);
              toast.error("Không thể tối ưu lúc này");
          }
      } catch (e) { 
          setPrompt(oldPrompt); 
          toast.error("Lỗi kết nối");
      }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col md:flex-row font-sans">
      
      {/* SIDEBAR MENU */}
      <aside className="w-full md:w-64 bg-[#121212] border-r border-gray-800 flex flex-col sticky top-0 h-screen overflow-y-auto">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
             <Link href="/" className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-pink-600">QT STUDIO</Link>
          </div>
          <nav className="flex-1 p-4 space-y-2">
             <Link href="/" className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-gray-400 hover:bg-gray-800 hover:text-white transition-all mb-6 border border-gray-800 hover:border-gray-600">
                <span className="text-xl">🏠</span><div className="font-bold text-sm">Quay về Trang chủ</div>
             </Link>
             <p className="text-xs text-gray-500 font-bold px-2 mb-2 uppercase tracking-wider">Công cụ AI</p>
             {MODES.map((m) => (
                 <button key={m.id} onClick={() => { setMode(m.id); setResult(null); setSelectedImages([]); setImagePreviews([]); }} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${mode === m.id ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                    <span className="text-xl">{m.icon}</span><div><div className="font-bold text-sm">{m.name}</div><div className="text-[10px] opacity-70 font-normal">{m.desc}</div></div>
                 </button>
             ))}
          </nav>
          <div className="p-4 border-t border-gray-800"><Link href="/pricing" className="block text-center bg-gray-800 hover:bg-gray-700 text-yellow-400 text-xs font-bold py-3 rounded-lg border border-gray-700">💎 Nâng cấp Pro</Link></div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-[url('/grid.svg')] bg-fixed">
          <div className="md:hidden mb-6 flex justify-between items-center bg-[#121212] p-4 rounded-xl">
             <Link href="/" className="text-gray-400 font-bold flex items-center gap-2"><span>←</span> Trang chủ</Link>
             <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-600">QT STUDIO</span>
          </div>

          <div className="max-w-4xl mx-auto">
             <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">{MODES.find(m => m.id === mode)?.icon} {MODES.find(m => m.id === mode)?.name}</h1>
             <p className="text-gray-400 mb-8">{MODES.find(m => m.id === mode)?.desc}</p>

             <div className="grid lg:grid-cols-2 gap-8 items-start">
                
                {/* --- INPUT --- */}
                <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800 shadow-xl">
                    {mode !== 'text-to-image' && (
                        <div className="mb-6">
                            <label className="block text-sm font-bold mb-2 text-gray-300 flex justify-between">
                                <span>{mode === 'nano-banana' ? 'Chọn các ảnh (Input)' : 'Chọn ảnh gốc'}</span>
                                {mode === 'nano-banana' && <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded">Được chọn nhiều ảnh</span>}
                            </label>
                            <div className="border-2 border-dashed border-gray-700 rounded-xl p-4 text-center hover:bg-gray-800 transition relative cursor-pointer group min-h-[150px] flex flex-col justify-center">
                                <input type="file" multiple={mode === 'nano-banana'} onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" accept="image/*" />
                                {imagePreviews.length > 0 ? (
                                    <div className="flex gap-2 overflow-x-auto p-2 scrollbar-hide z-0">
                                        {imagePreviews.map((src, index) => (
                                            <div key={index} className="relative min-w-[100px] h-24 shrink-0">
                                                <img src={src} className="w-full h-full object-cover rounded-lg shadow-md border border-gray-600" />
                                                <span className="absolute top-0 left-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-br-lg font-bold">#{index + 1}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-gray-500 py-4"><div className="text-4xl mb-2">☁️</div><p className="text-sm font-bold">Bấm để tải ảnh lên</p><p className="text-xs mt-1">{mode === 'nano-banana' ? 'Giữ Ctrl để chọn nhiều ảnh' : 'Hỗ trợ JPG, PNG'}</p></div>
                                )}
                            </div>
                        </div>
                    )}

                    {mode !== 'upscale' && mode !== 'remove-bg' && (
                        <div className="mb-6">
                            <label className="block text-sm font-bold mb-2 flex justify-between">
                                <span>{mode === 'nano-banana' ? 'Bạn muốn sửa gì?' : 'Mô tả ý tưởng'}</span>
                                <button onClick={handleMagicPrompt} className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1 bg-yellow-400/10 px-2 py-1 rounded-full border border-yellow-400/20">✨ Magic Prompt</button>
                            </label>
                            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full bg-black/50 border border-gray-700 rounded-xl p-3 text-sm h-32 focus:border-blue-500 outline-none resize-none placeholder-gray-600" placeholder={mode === 'nano-banana' ? "VD: Thêm cái kính râm vào, phong cách hoạt hình..." : "Mô tả bức tranh..."} />
                        </div>
                    )}

                    <button onClick={handleGenerate} disabled={loading} className={`w-full py-4 rounded-xl font-bold text-lg transition shadow-lg flex items-center justify-center gap-2 ${loading ? 'bg-gray-700 cursor-wait' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02] hover:shadow-purple-500/25'}`}>
                        {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Đang xử lý...</span></> : (mode === 'nano-banana' ? '🍌 Sửa ảnh ngay' : '🚀 Bắt đầu tạo')}
                    </button>
                </div>

                {/* --- KẾT QUẢ --- */}
                <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800 shadow-xl min-h-[400px] flex flex-col justify-center items-center relative">
                    {loading ? (<div className="text-center"><div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-gray-400 animate-pulse text-sm">AI đang làm việc...</p></div>) 
                    : result ? (<div className="relative group w-full animate-in zoom-in-95 duration-300"><img src={result} alt="Result" className="w-full rounded-lg shadow-2xl border border-gray-700" /><button onClick={() => result && handleDownload(result)} className="absolute bottom-4 right-4 bg-white text-black px-5 py-2.5 rounded-full font-bold shadow-xl hover:bg-gray-200 transition flex items-center gap-2 cursor-pointer z-10">⬇️ Tải về</button></div>) 
                    : (<div className="text-gray-600 text-center select-none"><div className="text-6xl mb-4 opacity-30 grayscale">{MODES.find(m => m.id === mode)?.icon}</div><p>Kết quả sẽ hiện ở đây</p></div>)}
                </div>
             </div>

             {/* === 👇 PHẦN DƯỚI: THƯ VIỆN BÀI VIẾT (ĐÃ CẬP NHẬT: CLICKABLE) === */}
             <div className="border-t border-gray-800 pt-10 mt-12">
                 <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-500">
                    📚 Thư viện Prompt & Ý tưởng
                 </h2>
                 <p className="text-gray-400 mb-8">Tham khảo các prompt hay từ cộng đồng. Bấm vào thẻ để đọc chi tiết!</p>
                 
                 {loadingPosts ? (
                    <div className="text-center py-10 text-gray-500">⏳ Đang tải thư viện...</div>
                 ) : posts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map(post => (
                            <div 
                                key={post._id} 
                                onClick={() => setViewingPost(post)} // 👈 THÊM SỰ KIỆN CLICK Ở ĐÂY
                                className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden hover:border-blue-500 transition group flex flex-col h-full shadow-lg cursor-pointer hover:-translate-y-1"
                            >
                                {/* Thumbnail */}
                                <div className="aspect-video bg-gray-900 relative overflow-hidden">
                                    {post.thumbnail ? (
                                        <img src={post.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl">🎨</div>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                        <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">Đọc bài này</span>
                                    </div>
                                </div>
                                {/* Content */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="font-bold text-lg mb-2 line-clamp-1 text-white group-hover:text-blue-400 transition">{post.title}</h3>
                                    
                                    <div className="bg-black/40 p-3 rounded-lg border border-gray-700 mb-2">
                                        <p className="text-sm text-gray-300 italic line-clamp-3 font-mono">
                                            "{post.excerpt || 'Không có mô tả'}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                 ) : (
                    <div className="text-center py-10 text-gray-500 border border-dashed border-gray-800 rounded-2xl">
                        Chưa có bài viết nào trong thư viện.
                    </div>
                 )}
             </div>

          </div>
      </main>

      {/* === 👇 MODAL ĐỌC CHI TIẾT (POPUP) === */}
      {viewingPost && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
              <div className="bg-[#1a1a1a] w-full max-w-2xl rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-[#1a1a1a] z-10">
                      <h3 className="font-bold text-lg text-white truncate pr-4">{viewingPost.title}</h3>
                      <button onClick={() => setViewingPost(null)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
                  </div>
                  
                  {/* Content Scrollable */}
                  <div className="overflow-y-auto p-6 space-y-6">
                      {viewingPost.thumbnail && (
                          <div className="rounded-xl overflow-hidden border border-gray-800">
                              <img src={viewingPost.thumbnail} className="w-full h-auto" />
                          </div>
                      )}

                      {/* Prompt Area (Cho phép bôi đen copy) */}
                      <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl">
                          <label className="text-blue-400 text-xs font-bold uppercase mb-2 block">🎯 Prompt (Câu lệnh):</label>
                          <p className="text-white font-mono text-sm leading-relaxed select-all">
                              {viewingPost.excerpt}
                          </p>
                          
                      </div>

                      {/* Nội dung bài viết */}
                      <div className="prose prose-invert prose-sm max-w-none text-gray-300 whitespace-pre-wrap">
                          {viewingPost.content || "Chưa có nội dung chi tiết."}
                      </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t border-gray-800 bg-[#121212]">
                      <button onClick={() => setViewingPost(null)} className="w-full py-3 rounded-xl font-bold bg-gray-800 hover:bg-gray-700 transition text-white">
                          Đóng cửa sổ
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}