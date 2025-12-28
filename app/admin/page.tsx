'use client';
import { useState } from 'react';

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    desc: '',
    category: 'swap', // Mặc định là ghép mặt
    modelId: 'codeplugtech/face-swap:278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34', // Model ghép mặt mặc định
    mainImage: '',
    variants: [] as string[],
    isHot: false
  });

  // Hàm upload ảnh lên Cloudinary
  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || 'ml_default');
    
    // Lấy cloud name từ biến môi trường
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'drinoqei7';
    
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      return data.secure_url;
    } catch (error) {
      console.error("Lỗi upload:", error);
      alert("Lỗi upload ảnh! Kiểm tra lại cấu hình Cloudinary.");
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.mainImage) return alert("Vui lòng nhập tên và ảnh bìa!");
    
    setLoading(true);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      if (res.ok) {
        alert("✅ Đã thêm mẫu mới thành công!");
        window.location.reload(); // Load lại trang để reset form
      } else {
        alert("❌ Lỗi khi lưu vào Database");
      }
    } catch (error) {
      alert("Lỗi kết nối Server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-black p-10 font-sans">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-extrabold mb-6 text-blue-600 border-b pb-4">⚙️ ADMIN DASHBOARD</h1>
        
        <div className="space-y-6">
          
          {/* 1. Tên & Mô tả */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold block mb-1">Tên mẫu:</label>
              <input 
                className="w-full border p-2 rounded focus:ring-2 ring-blue-500 outline-none" 
                placeholder="VD: Áo dài Tết 2024"
                onChange={e => setForm({...form, name: e.target.value})}
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Loại (Category):</label>
              <select 
                className="w-full border p-2 rounded"
                onChange={e => {
                  const cat = e.target.value;
                  // Tự động đổi Model ID theo loại
                  let model = 'codeplugtech/face-swap:278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34';
                  if (cat === 'enhance') model = 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73ab415c7259e3b9c4474';
                  
                  setForm({...form, category: cat, modelId: model});
                }}
              >
                <option value="swap">🎭 Ghép mặt (Face Swap)</option>
                <option value="enhance">✨ Làm nét (Upscale)</option>
              </select>
            </div>
          </div>

          <div>
             <label className="font-bold block mb-1">Mô tả ngắn:</label>
             <input 
                className="w-full border p-2 rounded"
                placeholder="VD: Hóa thân thành cô gái Việt Nam duyên dáng..."
                onChange={e => setForm({...form, desc: e.target.value})}
              />
          </div>

          {/* 2. Upload Ảnh Bìa */}
          <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg bg-gray-50">
            <p className="font-bold mb-2">📸 Ảnh bìa (Main Image):</p>
            <input type="file" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = await uploadToCloudinary(file);
                if (url) setForm({...form, mainImage: url});
              }
            }} />
            {form.mainImage && (
              <img src={form.mainImage} className="h-32 mt-3 rounded shadow-md border" alt="Preview" />
            )}
          </div>

          {/* 3. Upload Variants */}
          <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg bg-gray-50">
            <p className="font-bold mb-2">🖼️ Ảnh biến thể (Variants - Chọn nhiều ảnh):</p>
            <input type="file" multiple onChange={async (e) => {
              if (e.target.files) {
                const files = Array.from(e.target.files);
                const urls = await Promise.all(files.map(file => uploadToCloudinary(file)));
                // Lọc bỏ các giá trị null và thêm vào mảng variants
                const validUrls = urls.filter(url => url !== null) as string[];
                setForm({...form, variants: [...form.variants, ...validUrls]});
              }
            }} />
            
            {/* Hiển thị list ảnh variants */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {form.variants.map((v, i) => (
                <div key={i} className="relative group">
                   <img src={v} className="h-20 w-20 object-cover rounded shadow border" />
                   <button 
                     onClick={() => setForm({...form, variants: form.variants.filter((_, idx) => idx !== i)})}
                     className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                   >✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Tùy chọn khác */}
          <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-5 h-5 text-blue-600"
                onChange={e => setForm({...form, isHot: e.target.checked})} 
              />
              <span className="font-bold text-gray-700">🔥 Đánh dấu là HOT Trend</span>
            </label>
          </div>

          {/* 5. Nút Submit */}
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg disabled:bg-gray-400"
          >
            {loading ? '⏳ ĐANG LƯU VÀO DATABASE...' : '💾 LƯU MẪU MỚI'}
          </button>

        </div>
      </div>
    </div>
  );
}