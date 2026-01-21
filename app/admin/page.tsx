'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';


interface Template { _id: string; name: string; category: string; label: string; color: string; modelId: string; configParams: string; mainImage: string; variants?: string[]; isHot: boolean; }
interface Post { _id: string; title: string; slug: string; thumbnail: string; excerpt: string; content: string; prompts?: string[]; createdAt: string; }
//  Type User
interface UserData { _id: string; clerkId: string; email: string; firstName: string; lastName: string; photo: string; creditBalance: number; createdAt: string; role?: string; }

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // 👇 Thêm tab 'users'
  const [activeTab, setActiveTab] = useState<'stats' | 'templates' | 'blog' | 'users'>('stats');
  const [loading, setLoading] = useState(true);

  // Data
  const [stats, setStats] = useState({ users: 0, images: 0, credits: 0 });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [usersList, setUsersList] = useState<UserData[]>([]); // 👇 List User

  // --- STATE MODAL USER ---
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editCredits, setEditCredits] = useState(0);
  const [editRole, setEditRole] = useState("member");
  const [savingUser, setSavingUser] = useState(false);

  // --- STATE TEMPLATE & BLOG (GIỮ NGUYÊN) ---
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [name, setName] = useState(""); const [category, setCategory] = useState("swap"); const [label, setLabel] = useState("Hot"); const [color, setColor] = useState("bg-blue-500"); const [modelId, setModelId] = useState(""); const [configParams, setConfigParams] = useState(""); const [mainImage, setMainImage] = useState(""); const [variants, setVariants] = useState<string[]>([]); const [uploadingVariant, setUploadingVariant] = useState(false);
  
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [blogTitle, setBlogTitle] = useState(""); const [blogExcerpt, setBlogExcerpt] = useState(""); const [blogContent, setBlogContent] = useState(""); const [blogThumb, setBlogThumb] = useState(""); const [uploadingBlogThumb, setUploadingBlogThumb] = useState(false); const [blogPrompts, setBlogPrompts] = useState<string[]>([]); const [currentPrompt, setCurrentPrompt] = useState("");

  // --- INIT ---
  useEffect(() => {
    if (!isLoaded) return;
    const initData = async () => {
      if (!user || user.publicMetadata.role !== 'admin') {
        toast.error("⛔ Bạn không có quyền Admin!");
        router.push('/'); return;
      }
      try {
        const [statsRes, templRes, postsRes, usersRes] = await Promise.all([
            fetch('/api/admin/stats'),
            fetch('/api/templates'),
            fetch('/api/posts'),
            fetch('/api/admin/users') // 👇 Fetch thêm Users
        ]);
        
        const sData = await statsRes.json(); if (sData.stats) setStats(sData.stats);
        const tData = await templRes.json(); if (Array.isArray(tData)) setTemplates(tData);
        const pData = await postsRes.json(); if (Array.isArray(pData)) setPosts(pData);
        const uData = await usersRes.json(); if (Array.isArray(uData)) setUsersList(uData); // 👇 Set Users

        setLoading(false);
      } catch (error) { toast.error("Lỗi tải dữ liệu"); setLoading(false); }
    };
    initData();
  }, [isLoaded, user, router]);

  // --- SHARED FUNCTIONS ---
  const fetchTemplates = async () => { const res = await fetch('/api/templates'); setTemplates(await res.json()); };
  const fetchPosts = async () => { const res = await fetch('/api/posts'); setPosts(await res.json()); };
  const fetchUsers = async () => { const res = await fetch('/api/admin/users'); setUsersList(await res.json()); }; // 👇 Hàm reload user

  const uploadImage = async (file: File) => {
    const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || 'ml_default');
    try { const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData }); const data = await res.json(); return data.secure_url; } catch (error) { return null; }
  };

  // --- USER LOGIC (MỚI) ---
  const handleEditUser = (u: UserData) => {
      setEditingUser(u);
      setEditCredits(u.creditBalance);
      // Mặc định là member, nếu cần check role thật thì phải lấy từ Clerk hoặc lưu trong DB
      setEditRole("member"); 
      setIsUserModalOpen(true);
  };

  const handleSaveUser = async () => {
      if (!editingUser) return;
      setSavingUser(true);
      try {
          await fetch('/api/admin/users', {
              method: 'PUT',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                  _id: editingUser._id,
                  clerkId: editingUser.clerkId,
                  credits: editCredits,
                  role: editRole
              })
          });
          toast.success("Cập nhật thành công!");
          setIsUserModalOpen(false);
          fetchUsers();
      } catch (e) { toast.error("Lỗi cập nhật"); }
      finally { setSavingUser(false); }
  };

  const handleDeleteUser = async (id: string, clerkId: string) => {
      if(confirm("CẢNH BÁO: Xóa user này sẽ xóa vĩnh viễn khỏi Database và Clerk! Tiếp tục?")) {
          await fetch(`/api/admin/users?id=${id}&clerkId=${clerkId}`, { method: 'DELETE' });
          toast.success("Đã xóa user");
          fetchUsers();
      }
  };

  // --- CÁC HÀM CŨ (GIỮ NGUYÊN - RÚT GỌN ĐỂ DISPLAY) ---
  const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) { const url = await uploadImage(e.target.files[0]); if (url) setMainImage(url); } };
  const handleVariantUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) { setUploadingVariant(true); const url = await uploadImage(e.target.files[0]); if (url) setVariants(prev => [...prev, url]); setUploadingVariant(false); e.target.value = ""; } };
  const resetTemplateForm = () => { setEditingTemplateId(null); setName(""); setCategory("swap"); setLabel("Hot"); setColor("bg-blue-500"); setModelId(""); setConfigParams(""); setMainImage(""); setVariants([]); };
  const handleSaveTemplate = async () => { if (!name || !modelId || !mainImage) return toast.warning("Thiếu thông tin!"); setSavingTemplate(true); try { const url = '/api/templates'; const method = editingTemplateId ? 'PUT' : 'POST'; const body = editingTemplateId ? JSON.stringify({ _id: editingTemplateId, name, category, label, color, modelId, configParams, mainImage, variants, isHot: false }) : JSON.stringify({ name, category, label, color, modelId, configParams, mainImage, variants, isHot: false }); await fetch(url, { method, headers: {'Content-Type': 'application/json'}, body }); toast.success("Xong!"); setIsTemplateModalOpen(false); resetTemplateForm(); fetchTemplates(); } catch(e) { toast.error("Lỗi"); } finally { setSavingTemplate(false); } };
  const handleEditTemplate = (t: Template) => { setEditingTemplateId(t._id); setName(t.name); setCategory(t.category); setLabel(t.label); setColor(t.color); setModelId(t.modelId); setConfigParams(t.configParams); setMainImage(t.mainImage); setVariants(t.variants || []); setIsTemplateModalOpen(true); };
  const handleDeleteTemplate = async (id: string) => { if(confirm("Xóa mẫu?")) { await fetch(`/api/templates?id=${id}`, { method: 'DELETE' }); fetchTemplates(); } };
  const addPromptToBlog = () => { if (currentPrompt.trim()) { setBlogPrompts([...blogPrompts, currentPrompt.trim()]); setCurrentPrompt(""); } };
  const removePromptFromBlog = (index: number) => { setBlogPrompts(blogPrompts.filter((_, i) => i !== index)); };
  const resetBlogForm = () => { setEditingPostId(null); setBlogTitle(""); setBlogExcerpt(""); setBlogContent(""); setBlogThumb(""); setBlogPrompts([]); setCurrentPrompt(""); };
  const handleEditPost = (p: Post) => { setEditingPostId(p._id); setBlogTitle(p.title); setBlogExcerpt(p.excerpt); setBlogContent(p.content); setBlogThumb(p.thumbnail); setBlogPrompts(p.prompts || []); setIsBlogModalOpen(true); };
  const handleSavePost = async () => { if (!blogTitle || !blogContent) return toast.warning("Thiếu thông tin!"); setSavingPost(true); try { const method = editingPostId ? 'PUT' : 'POST'; const body = editingPostId ? JSON.stringify({ _id: editingPostId, title: blogTitle, content: blogContent, thumbnail: blogThumb, excerpt: blogExcerpt, prompts: blogPrompts }) : JSON.stringify({ title: blogTitle, content: blogContent, thumbnail: blogThumb, excerpt: blogExcerpt, prompts: blogPrompts }); await fetch('/api/posts', { method, headers: {'Content-Type': 'application/json'}, body }); toast.success("Xong!"); setIsBlogModalOpen(false); resetBlogForm(); fetchPosts(); } catch(e) { toast.error("Lỗi"); } finally { setSavingPost(false); } };
  const handleDeletePost = async (id: string) => { if(confirm("Xóa bài?")) { await fetch(`/api/posts?id=${id}`, { method: 'DELETE' }); fetchPosts(); } };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">⏳ Đang tải...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10 font-sans">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-8 border-b border-gray-800 pb-6 flex flex-col md:flex-row justify-between items-end gap-4">
          <div><h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">🛡️ Admin Dashboard</h1><p className="text-gray-400 text-sm">Quản lý hệ thống</p></div>
          <div className="flex bg-gray-900 p-1 rounded-lg">
            <button onClick={() => setActiveTab('stats')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'stats' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>📊 Thống kê</button>
            <button onClick={() => setActiveTab('templates')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'templates' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>🎨 Mẫu AI</button>
            <button onClick={() => setActiveTab('blog')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'blog' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}>📝 Blog</button>
            
            <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'users' ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'}`}>👥 Người dùng</button>
          </div>
      </div>

      <div className="max-w-7xl mx-auto">
        
        {/*THỐNG KÊ */}
        {activeTab === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
                <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800 shadow-lg"><div className="text-gray-400 text-xs font-bold uppercase mb-2">Thành viên</div><div className="text-4xl font-extrabold text-blue-400">{stats.users}</div></div>
                <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800 shadow-lg"><div className="text-gray-400 text-xs font-bold uppercase mb-2">Ảnh đã tạo</div><div className="text-4xl font-extrabold text-purple-400">{stats.images}</div></div>
                <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800 shadow-lg"><div className="text-gray-400 text-xs font-bold uppercase mb-2">Tổng Xu</div><div className="text-4xl font-extrabold text-yellow-400">{stats.credits}</div></div>
            </div>
        )}

        {/* TEMPLATES */}
        {activeTab === 'templates' && (
            <div className="animate-in fade-in">
                <div className="flex justify-end mb-4"><button onClick={() => { resetTemplateForm(); setIsTemplateModalOpen(true); }} className="bg-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-500 shadow-lg flex items-center gap-2">➕ Thêm Mẫu Mới</button></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(t => (<div key={t._id} className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800 flex gap-4"><img src={t.mainImage} className="w-20 h-20 object-cover rounded-lg bg-gray-900 border border-gray-700" /><div className="flex-1 min-w-0"><div className="font-bold text-white truncate">{t.name}</div><div className="text-xs text-gray-500 mb-2">{t.category}</div><div className="flex gap-2"><button onClick={() => handleEditTemplate(t)} className="text-blue-400 text-xs font-bold bg-blue-900/30 px-2 py-1 rounded">Sửa</button><button onClick={() => handleDeleteTemplate(t._id)} className="text-red-400 text-xs font-bold bg-red-900/30 px-2 py-1 rounded">Xóa</button></div></div></div>))}
                </div>
            </div>
        )}

        {/* BLOG */}
        {activeTab === 'blog' && (
            <div className="animate-in fade-in">
                <div className="flex justify-end mb-4"><button onClick={() => { resetBlogForm(); setIsBlogModalOpen(true); }} className="bg-green-600 px-4 py-2 rounded-lg font-bold hover:bg-green-500 shadow-lg flex items-center gap-2">✍️ Viết Bài Mới</button></div>
                <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-800">
                    <table className="w-full text-left text-sm"><thead className="bg-gray-900 text-gray-400 uppercase text-xs"><tr><th className="p-4">Bài viết</th><th className="p-4">Ngày đăng</th><th className="p-4 text-right">Hành động</th></tr></thead><tbody className="divide-y divide-gray-800">{posts.map(p => (<tr key={p._id} className="hover:bg-gray-800/50"><td className="p-4 font-medium flex items-center gap-3">{p.thumbnail && <img src={p.thumbnail} className="w-10 h-10 rounded object-cover"/>}{p.title}</td><td className="p-4 text-gray-500">{new Date(p.createdAt).toLocaleDateString('vi-VN')}</td><td className="p-4 text-right"><button onClick={() => handleEditPost(p)} className="text-blue-400 hover:text-blue-300 font-bold px-3 py-1 bg-blue-900/20 rounded mr-2">Sửa</button><button onClick={() => handleDeletePost(p._id)} className="text-red-400 hover:text-red-300 font-bold px-3 py-1 bg-red-900/20 rounded">Xóa</button></td></tr>))}</tbody></table>
                </div>
            </div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
             <div className="animate-in fade-in">
                 <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-800">
                     <table className="w-full text-left text-sm">
                         <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                             <tr>
                                 <th className="p-4">Người dùng</th>
                                 <th className="p-4">Số xu (Credits)</th>
                                 <th className="p-4">Ngày tham gia</th>
                                 <th className="p-4 text-right">Hành động</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-800">
                             {usersList.map(u => (
                                 <tr key={u._id} className="hover:bg-gray-800/50">
                                     <td className="p-4 font-medium flex items-center gap-3">
                                         <img src={u.photo || "https://github.com/shadcn.png"} className="w-8 h-8 rounded-full bg-gray-700"/>
                                         <div>
                                             <div className="text-white font-bold">{u.email}</div>
                                             <div className="text-xs text-gray-500">{u.firstName} {u.lastName}</div>
                                         </div>
                                     </td>
                                     <td className="p-4 text-yellow-400 font-bold">{u.creditBalance} xu</td>
                                     <td className="p-4 text-gray-500">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                                     <td className="p-4 text-right">
                                         <button onClick={() => handleEditUser(u)} className="text-blue-400 hover:text-blue-300 font-bold px-3 py-1 bg-blue-900/20 rounded mr-2">Sửa / Nạp Xu</button>
                                         <button onClick={() => handleDeleteUser(u._id, u.clerkId)} className="text-red-400 hover:text-red-300 font-bold px-3 py-1 bg-red-900/20 rounded">Xóa</button>
                                     </td>
                                 </tr>
                             ))}
                             {usersList.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-500">Chưa có thành viên nào</td></tr>}
                         </tbody>
                     </table>
                 </div>
             </div>
        )}
      </div>

      {/* TEMPLATES  */}
      {isTemplateModalOpen && (<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div className="bg-[#1a1a1a] rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl"><h2 className="text-xl font-bold mb-4 text-blue-400">{editingTemplateId ? "Cập Nhật" : "Thêm Mới"}</h2><div className="space-y-3"><div className="grid grid-cols-2 gap-3"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Tên mẫu" className="bg-black/50 border border-gray-700 p-2 rounded w-full"/><select value={category} onChange={e=>setCategory(e.target.value)} className="bg-black/50 border border-gray-700 p-2 rounded w-full"><option value="swap">Ghép mặt</option><option value="enhance">Làm nét</option><option value="remove-bg">Tách nền</option><option value="text-to-image">Vẽ tranh</option></select></div><div className="grid grid-cols-2 gap-3"><input value={label} onChange={e=>setLabel(e.target.value)} placeholder="Nhãn" className="bg-black/50 border border-gray-700 p-2 rounded w-full"/><input value={color} onChange={e=>setColor(e.target.value)} placeholder="Màu (bg-blue-500)" className="bg-black/50 border border-gray-700 p-2 rounded w-full"/></div><input value={modelId} onChange={e=>setModelId(e.target.value)} placeholder="Replicate Model ID" className="bg-black/50 border border-gray-700 p-2 rounded w-full font-mono text-sm text-green-400"/><textarea value={configParams} onChange={e=>setConfigParams(e.target.value)} placeholder='Config JSON' className="bg-black/50 border border-gray-700 p-2 rounded w-full font-mono text-sm h-20"/><div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-3"><div><label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Ảnh bìa</label><label className="cursor-pointer bg-gray-800 border border-dashed border-gray-600 rounded h-24 flex items-center justify-center overflow-hidden relative">{mainImage ? <img src={mainImage} className="absolute w-full h-full object-cover"/> : <span className="text-xs">Tải ảnh</span>}<input type="file" onChange={handleMainImageChange} className="hidden"/></label></div><div><div className="flex justify-between mb-1"><label className="text-xs text-gray-400 uppercase font-bold">Biến thể ({variants.length})</label><label className="text-xs text-blue-400 cursor-pointer"><input type="file" onChange={handleVariantUpload} className="hidden"/>{uploadingVariant ? '...' : '+ Thêm'}</label></div><div className="grid grid-cols-4 gap-1 bg-black/30 p-1 rounded h-24 overflow-y-auto">{variants.map((v,i)=>(<div key={i} className="relative group aspect-square"><img src={v} className="w-full h-full object-cover rounded"/><button onClick={()=>setVariants(p=>p.filter((_,idx)=>idx!==i))} className="absolute top-0 right-0 bg-red-500 w-4 h-4 text-[10px] flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100">✕</button></div>))}</div></div></div></div><div className="flex justify-end gap-2 mt-6"><button onClick={()=>setIsTemplateModalOpen(false)} className="px-4 py-2 bg-gray-700 rounded text-sm font-bold">Hủy</button><button onClick={handleSaveTemplate} disabled={savingTemplate} className="px-4 py-2 bg-blue-600 rounded text-sm font-bold">{savingTemplate ? 'Đang lưu...' : 'Lưu lại'}</button></div></div></div>)}

      {/* BLOG  */}
      {isBlogModalOpen && (<div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div className="bg-[#1a1a1a] w-full max-w-3xl p-6 rounded-2xl border border-gray-700 shadow-2xl h-[90vh] flex flex-col"><h2 className="text-xl font-bold mb-4 text-green-400">{editingPostId ? "Sửa Bài" : "Viết Bài"}</h2><div className="flex-1 overflow-y-auto space-y-4 pr-2"><input value={blogTitle} onChange={e=>setBlogTitle(e.target.value)} placeholder="Tiêu đề" className="w-full bg-black/50 border border-gray-700 p-4 rounded-xl text-lg font-bold outline-none"/><div className="bg-black/30 p-4 rounded-xl border border-gray-700"><label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Prompt ({blogPrompts.length})</label><div className="flex gap-2 mb-2"><input value={currentPrompt} onChange={e => setCurrentPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPromptToBlog()} placeholder="Nhập prompt..." className="flex-1 bg-black/50 border border-gray-600 p-2 rounded text-sm outline-none" /><button onClick={addPromptToBlog} type="button" className="bg-blue-600 px-3 rounded font-bold text-sm">Thêm</button></div><div className="space-y-1 max-h-32 overflow-y-auto pr-1">{blogPrompts.map((p, idx) => (<div key={idx} className="flex justify-between items-center bg-gray-800 p-2 rounded text-xs border border-gray-700"><span className="truncate flex-1 mr-2 text-gray-300 italic">"{p}"</span><button onClick={() => removePromptFromBlog(idx)} className="text-red-400 font-bold">✕</button></div>))}</div></div><textarea value={blogExcerpt} onChange={e=>setBlogExcerpt(e.target.value)} placeholder="Sapo..." className="w-full bg-black/50 border border-gray-700 p-3 rounded-xl text-sm h-16 resize-none outline-none"/><div className="flex items-center gap-3"><label className="cursor-pointer bg-gray-800 px-3 py-2 rounded border border-gray-600 text-sm">{uploadingBlogThumb ? '...' : '📷 Ảnh bìa'}<input type="file" className="hidden" onChange={async(e)=>{if(e.target.files?.[0]){setUploadingBlogThumb(true);const url=await uploadImage(e.target.files[0]);if(url)setBlogThumb(url);setUploadingBlogThumb(false);}}}/></label>{blogThumb && <img src={blogThumb} className="h-12 rounded border border-gray-600"/>}</div><textarea value={blogContent} onChange={e=>setBlogContent(e.target.value)} placeholder="Nội dung..." className="w-full bg-black/50 border border-gray-700 p-4 rounded-xl h-[300px] font-mono text-sm leading-relaxed outline-none resize-none"/></div><div className="pt-4 border-t border-gray-800 flex justify-end gap-3"><button onClick={()=>setIsBlogModalOpen(false)} className="px-4 py-2 rounded bg-gray-800 font-bold">Hủy</button><button onClick={handleSavePost} disabled={savingPost} className="px-6 py-2 rounded bg-green-600 font-bold">{savingPost ? 'Đang lưu...' : 'Lưu bài'}</button></div></div></div>)}

      {/* EDIT USER */}
      {isUserModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md p-6 border border-gray-700 shadow-2xl">
                <h2 className="text-xl font-bold mb-4 text-pink-500">Sửa Người Dùng</h2>
                <div className="mb-4 text-center">
                    <img src={editingUser.photo || "https://github.com/shadcn.png"} className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-pink-500"/>
                    <div className="text-white font-bold">{editingUser.email}</div>
                    <div className="text-xs text-gray-500">ID: {editingUser._id}</div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-gray-400 text-xs font-bold uppercase mb-1 block">Số Xu (Credits)</label>
                        <input 
                            type="number" 
                            value={editCredits} 
                            onChange={e => setEditCredits(parseInt(e.target.value))} 
                            className="bg-black/50 border border-gray-700 p-3 rounded w-full text-yellow-400 font-bold"
                        />
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs font-bold uppercase mb-1 block">Quyền Hạn</label>
                        <select 
                            value={editRole} 
                            onChange={e => setEditRole(e.target.value)} 
                            className="bg-black/50 border border-gray-700 p-3 rounded w-full text-white"
                        >
                            <option value="member">Thành viên (Member)</option>
                            <option value="admin">Quản trị viên (Admin)</option>
                        </select>
                        <p className="text-[10px] text-gray-500 mt-1">*Admin có quyền truy cập trang này.</p>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={()=>setIsUserModalOpen(false)} className="px-4 py-2 bg-gray-700 rounded text-sm font-bold">Hủy</button>
                    <button onClick={handleSaveUser} disabled={savingUser} className="px-4 py-2 bg-pink-600 rounded text-sm font-bold">{savingUser ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}