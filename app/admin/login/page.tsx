'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [pass, setPass] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    // Gọi API để xác thực và lưu cookie
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: pass })
    });
    
    if (res.ok) {
      router.push('/admin'); // Đúng pass thì cho vào
    } else {
      alert("Sai mật khẩu rồi bạn ơi! 🚫");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6 text-pink-500">🔒 KHU VỰC QUẢN TRỊ</h1>
        <input 
          type="password" 
          placeholder="Nhập mật khẩu Admin..." 
          className="w-full p-3 rounded bg-gray-800 border border-gray-700 mb-4 focus:border-pink-500 outline-none text-white"
          onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        <button onClick={handleLogin} className="w-full bg-pink-600 text-white p-3 rounded font-bold hover:bg-pink-700">
          MỞ KHÓA 🔓
        </button>
      </div>
    </div>
  );
}