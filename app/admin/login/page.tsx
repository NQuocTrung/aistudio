'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!pass) return toast.warning("Chưa nhập mật khẩu!");
    setLoading(true);

    try {
      // Gọi đúng API admin/login
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Đăng nhập thành công!");
        window.location.href = '/admin';
      } else {
        toast.error("Sai mật khẩu!");
      }
    } catch (error) {
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-gray-800 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6 text-pink-500">🔒 ADMIN ACCESS</h1>
        <input 
          type="password" 
          placeholder="Nhập mật khẩu..." 
          className="w-full p-3 rounded bg-gray-900 border border-gray-700 mb-4 text-white outline-none focus:border-pink-500"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        />
        <button 
          onClick={handleLogin} 
          disabled={loading}
          className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white p-3 rounded font-bold hover:opacity-90"
        >
          {loading ? "Đang kiểm tra..." : "MỞ KHÓA 🔓"}
        </button>
      </div>
    </div>
  );
}