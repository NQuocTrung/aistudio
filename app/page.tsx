'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { toast } from 'sonner';


interface Template {
  _id: string;
  name: string;
  mainImage: string;
  category: string;
  label?: string;
  color?: string;
  isHot: boolean;
}

interface FeedItem {
  _id: string;
  resultImage: string;
  prompt?: string;
  createdAt: string;
}

interface Post {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  thumbnail: string;
  createdAt: string;
}

export default function Home() {
  const { user, isLoaded, isSignedIn } = useUser();
  const isAdmin = isLoaded && user?.publicMetadata?.role === 'admin';

  // --- STATE ---
  const [templates, setTemplates] = useState<Template[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [posts, setPosts] = useState<Post[]>([]); 
  
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingFeed, setLoadingFeed] = useState(true);
  
  const [credits, setCredits] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [readingPost, setReadingPost] = useState<Post | null>(null); 

  useEffect(() => {
    // Templates
    fetch('/api/templates')
      .then((res) => res.json())
      .then((data) => {
        setTemplates(Array.isArray(data) ? data : []);
        setLoadingTemplates(false);
      })
      .catch(() => setLoadingTemplates(false));

    // Cộng đồng
    fetch('/api/feed') 
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.images || []);
        setFeed(list);
        setLoadingFeed(false);
      })
      .catch(() => setLoadingFeed(false));

    // Blog Posts
    fetch('/api/posts')
      .then((res) => res.json())
      .then((data) => {
        if(Array.isArray(data)) setPosts(data);
      })
      .catch(console.error);

  }, []);

  //  Credits
  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/user/check')
        .then(res => res.json())
        .then(data => { if (data.credits !== undefined) setCredits(data.credits); })
        .catch(console.error);
    }
  }, [isSignedIn]);

  const handleCopyPrompt = (prompt: string | undefined, id: string) => {
    if (!prompt) return toast.warning("Ảnh này không có prompt!");
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    toast.success("Đã copy prompt!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      
      {/*HEADER */}
      <header className="flex justify-between items-center p-6 border-b border-gray-800 backdrop-blur-md sticky top-0 z-50 bg-gray-950/80">
        <Link href="/" className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-600 cursor-pointer">QT STUDIO</Link>
        <div className="flex items-center gap-3">
            <Link href="/history" className="hidden md:flex bg-gray-800 border border-gray-700 px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-700 hover:text-green-400 transition items-center gap-2">🕰️ Lịch sử</Link>
            <Link href="/sang-tao" className="hidden md:flex bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 rounded-full text-sm font-bold hover:opacity-90 transition items-center gap-2 shadow-lg shadow-purple-500/20">✨ Sáng tạo</Link>
            <Link href="/pricing" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-full text-sm font-bold hover:scale-105 transition shadow-lg shadow-yellow-500/20 flex items-center gap-2">💎 Bảng giá</Link>
            <SignedOut><SignInButton mode="modal"><button className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition">Đăng nhập</button></SignInButton></SignedOut>
            <SignedIn>
              <div className="flex items-center gap-3">
                 {credits !== null && (
                    <Link href="/pricing" className="hidden sm:flex bg-yellow-500/10 text-yellow-300 border border-yellow-500/50 px-3 py-1.5 rounded-full text-xs font-bold items-center gap-1 hover:bg-yellow-500/20 transition cursor-pointer group">
                        <span>💰 {credits}</span><span className="w-4 h-4 bg-yellow-500 text-black rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity ml-1">+</span>
                    </Link>
                 )}
                 {isAdmin && <Link href="/admin" className="bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-red-700 transition shadow-lg shadow-red-500/20 flex items-center gap-2">🛡️ Admin</Link>}
                 <UserButton afterSignOutUrl="/"/>
              </div>
            </SignedIn>
        </div>
      </header>

      <div className="text-center py-20 px-4 bg-[url('/grid.svg')] bg-fixed">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">Sáng tạo ảnh <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">bằng AI cực chất</span></h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">Kho mẫu đa dạng & Cộng đồng chia sẻ ý tưởng không giới hạn.</p>
        <div className="flex justify-center gap-4">
             <Link href="/sang-tao" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full font-bold text-lg hover:scale-105 transition shadow-xl shadow-purple-500/30 flex items-center gap-2 transform hover:-translate-y-1">✨ Sáng tạo ngay</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-20 pb-20">
        
        {/* DANH SÁCH MẪU */}
        <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">🔥 Mẫu Hot đang thịnh hành</h2>
            {loadingTemplates ? (
                <div className="text-center text-gray-500 py-10">⏳ Đang tải danh sách mẫu...</div>
            ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {templates.map((t) => (
                    <Link href={`/tao/${t._id}`} key={t._id} className="group relative block bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-pink-500 transition-all hover:shadow-2xl hover:shadow-pink-500/20 hover:-translate-y-1">
                        <div className="aspect-[3/4] overflow-hidden">
                            <img src={t.mainImage} alt={t.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        {t.isHot && <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">HOT 🔥</div>}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-10">
                            <h3 className="font-bold text-lg mb-1 truncate">{t.name}</h3>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded ${t.color || 'bg-gray-600'} text-white inline-block shadow-sm`}>{t.label || t.category}</span>
                        </div>
                    </Link>
                ))}
            </div>
            )}
        </section>

        {/*  BLOG  */}
        {posts.length > 0 && (
            <section className="border-t border-gray-800 pt-10">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-500">📰 Blog & Chia sẻ</h2>
                        <p className="text-gray-400 text-sm mt-1">Kinh nghiệm & Thủ thuật AI mới nhất</p>
                    </div>
                    {isAdmin && <Link href="/admin" className="text-sm text-green-400 hover:text-white underline">Viết bài mới</Link>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {posts.map((post) => (
                        <article key={post._id} className="group cursor-pointer flex flex-col gap-3" onClick={() => setReadingPost(post)}>
                            <div className="aspect-video rounded-xl overflow-hidden border border-gray-800 bg-gray-900 relative">
                                {post.thumbnail ? (
                                    <img src={post.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-800">✍️</div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <span className="bg-white text-black px-4 py-2 rounded-full font-bold text-sm transform translate-y-2 group-hover:translate-y-0 transition">Đọc ngay</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg group-hover:text-blue-400 transition line-clamp-2">{post.title}</h3>
                                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{post.excerpt || "Bấm để xem chi tiết..."}</p>
                                <div className="text-xs text-gray-600 mt-2">{new Date(post.createdAt).toLocaleDateString('vi-VN')}</div>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        )}

        {/* CỘNG ĐỒNG SÁNG TẠO  */}
        <section className="border-t border-gray-800 pt-10">
             <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">🌏 Cộng đồng sáng tạo</h2>
                    <p className="text-gray-400 text-sm mt-1">Những tác phẩm đẹp nhất do người dùng chia sẻ</p>
                </div>
                <Link href="/sang-tao" className="text-sm text-blue-400 hover:text-white underline">+ Đóng góp ngay</Link>
             </div>

             {loadingFeed ? (
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">{[1,2,3,4].map(i => <div key={i} className="h-64 bg-gray-800 rounded-xl"></div>)}</div>
             ) : feed.length === 0 ? (
                 <div className="text-center py-10 border border-dashed border-gray-800 rounded-2xl text-gray-500">Chưa có tác phẩm nào. Hãy là người đầu tiên!</div>
             ) : (
                <div className="columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
                    {feed.map((item) => (
                        <div key={item._id} className="break-inside-avoid rounded-xl overflow-hidden bg-[#121212] border border-gray-800 hover:border-gray-600 transition group relative">
                            <img src={item.resultImage} alt="Art" className="w-full" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                                {item.prompt && <p className="text-xs text-gray-300 line-clamp-3 mb-3 italic">"{item.prompt}"</p>}
                                <div className="flex justify-between items-center gap-2">
                                    <button onClick={(e) => { e.preventDefault(); handleCopyPrompt(item.prompt, item._id); }} className={`flex-1 text-xs py-2 rounded-md font-bold transition ${copiedId === item._id ? 'bg-green-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md'}`}>
                                        {copiedId === item._id ? '✅ Đã Copy' : '📋 Copy Prompt'}
                                    </button>
                                    <a href={item.resultImage} target="_blank" className="p-2 bg-white/10 rounded-md hover:bg-white/20 text-white">↗️</a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
             )}
        </section>

      </div>

      {readingPost && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex justify-center overflow-y-auto p-4 md:p-10">
            <div className="bg-[#121212] w-full max-w-3xl rounded-2xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200 h-fit mb-10">
                <button onClick={() => setReadingPost(null)} className="absolute top-4 right-4 bg-gray-800/80 hover:bg-gray-700 text-white w-10 h-10 rounded-full flex items-center justify-center z-10 font-bold transition">✕</button>
                {readingPost.thumbnail && (
                    <div className="h-64 md:h-80 w-full relative">
                        <img src={readingPost.thumbnail} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] to-transparent"></div>
                    </div>
                )}
                <div className="p-8 md:p-12">
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400 leading-tight">{readingPost.title}</h1>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-800">
                        <span>📅 {new Date(readingPost.createdAt).toLocaleDateString('vi-VN')}</span><span>✍️ Admin Studio</span>
                    </div>
                    <div className="prose prose-invert prose-lg max-w-none text-gray-300 whitespace-pre-wrap leading-relaxed">{readingPost.content}</div>
                </div>
                <div className="p-8 border-t border-gray-800 bg-[#0a0a0a] text-center">
                    <button onClick={() => setReadingPost(null)} className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-full font-bold transition">Đóng bài viết</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}