'use client';
import { useState, useEffect, use } from 'react';

// Định nghĩa kiểu dữ liệu cho Template
interface Template {
  _id: string;
  name: string;
  mainImage: string;
  category: string;
  modelId: string;
  variants: string[];
}

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params (bắt buộc trong Next.js mới)
  const { id } = use(params);
  
  const [template, setTemplate] = useState<Template | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [userFile, setUserFile] = useState<File | null>(null);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // 1. Lấy thông tin mẫu từ Database
  useEffect(() => {
    fetch('/api/templates')
      .then((res) => res.json())
      .then((data: Template[]) => {
        const found = data.find((t) => t._id === id);
        if (found) {
          setTemplate(found);
          // Mặc định chọn ảnh variants đầu tiên, nếu không có thì lấy ảnh bìa
          setSelectedStyle(found.variants?.[0] || found.mainImage);
        }
      })
      .catch(err => console.error("Lỗi tải mẫu:", err));
  }, [id]);

  // Hàm upload ảnh
  const upload = async (file: File) => {
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || 'ml_default');
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'drinoqei7';
    
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: data });
    const json = await res.json();
    return json.secure_url;
  };

// ... Các phần code khác giữ nguyên

  const handleRun = async () => {
    if (!userFile) return alert("Vui lòng chọn ảnh của bạn!");
    if (!template) return;

    // === 👇 BẮT ĐẦU ĐOẠN KIỂM TRA GIỚI HẠN 👇 ===
    // Tạo key theo ngày (Ví dụ: ai-usage-Sun Dec 28 2025)
    // Để qua ngày hôm sau nó tự reset về 0
    const TODAY = new Date().toDateString(); 
    const storageKey = `ai-usage-${TODAY}`;
    
    // Lấy số lần đã dùng từ bộ nhớ (Nếu chưa có thì tính là 0)
    const usageCount = parseInt(localStorage.getItem(storageKey) || '0');

    // Nếu đã dùng 3 lần thì chặn lại
    if (usageCount >= 3) {
      return alert("🚫 Bạn đã hết 3 lượt dùng miễn phí hôm nay! Hãy quay lại vào ngày mai nhé.");
    }
    // === 👆 KẾT THÚC ĐOẠN KIỂM TRA 👆 ===

    setLoading(true);
    setResult("");
    
    try {
      setStatus("Đang tải ảnh lên...");
      const userUrl = await upload(userFile);
      
      setStatus("Đang xử lý AI...");
      
      let aiInput = {};
      if (template.category === 'swap') {
         aiInput = { 
            input_image: selectedStyle, 
            swap_image: userUrl 
         };
      } else {
         aiInput = { image: userUrl };
      }

      const res = await fetch('/api/run', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ model: template.modelId, input: aiInput })
      });
      
      const data = await res.json();
      
      if(data.error) throw new Error(data.error);

      // === 👇 NẾU THÀNH CÔNG THÌ TRỪ LƯỢT 👇 ===
      if (data.result) {
        setResult(data.result);
        setStatus("Thành công!");
        
        // Tăng số lần dùng lên 1 và lưu lại
        localStorage.setItem(storageKey, (usageCount + 1).toString());
        
        // Thông báo cho khách biết còn bao nhiêu lượt
        alert(`✅ Tạo ảnh thành công! Bạn còn ${2 - usageCount} lượt dùng trong hôm nay.`);
      }
      // === 👆 HẾT PHẦN TRỪ LƯỢT 👆 ===

    } catch (e: any) {
      alert("Lỗi: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // ... Các phần code render bên dưới giữ nguyên



  // 👇 HÀM MỚI: Xử lý tải ảnh về máy
  const handleDownload = async () => {
    if (!result) return;
    
    try {
      // Đổi nút thành trạng thái "Đang tải..."
      const btn = document.getElementById('download-btn');
      if(btn) btn.innerText = "⏳ Đang tải về...";

      // 1. Fetch ảnh về dưới dạng Blob (Dữ liệu nhị phân)
      const response = await fetch(result);
      const blob = await response.blob();

      // 2. Tạo đường link ảo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Đặt tên file (VD: ai-studio-17638123.png)
      link.download = `ai-studio-${Date.now()}.png`; 
      
      // 3. Kích hoạt tải xuống
      document.body.appendChild(link);
      link.click();
      
      // 4. Dọn dẹp
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      if(btn) btn.innerText = "⬇️ Tải ảnh về máy";
    } catch (error) {
      console.error('Lỗi tải ảnh:', error);
      alert("Không thể tải trực tiếp. Hãy chuột phải vào ảnh và chọn 'Lưu ảnh thành...'");
      // Fallback: Mở tab mới nếu lỗi
      window.open(result, '_blank');
    }
  };

  if (!template) return <div className="text-white text-center p-20">⏳ Đang tải dữ liệu...</div>;

  
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col md:flex-row p-6 gap-6 font-sans">
      
      {/* CỘT TRÁI: BẢNG ĐIỀU KHIỂN */}
      <div className="w-full md:w-[450px] bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col h-fit">
        <a href="/" className="text-gray-400 mb-6 hover:text-white flex items-center gap-2 transition-colors">
          ← Quay lại trang chủ
        </a>

        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-6">
          {template.name}
        </h1>
        
        {/* Chọn Style (Nếu có variants) */}
        {template.variants?.length > 0 && (
          <div className="mb-6">
            <p className="font-bold mb-3 text-gray-300">1. Chọn kiểu dáng:</p>
            <div className="grid grid-cols-3 gap-3">
              {template.variants.map((v, i) => (
                <div 
                   key={i} 
                   onClick={() => setSelectedStyle(v)} 
                   className={`aspect-[2/3] rounded-lg overflow-hidden border-2 cursor-pointer transition-all relative ${selectedStyle === v ? 'border-pink-500 ring-2 ring-pink-500/30' : 'border-gray-700 hover:border-gray-500 opacity-60 hover:opacity-100'}`}
                >
                  <img src={v} className="w-full h-full object-cover" />
                  {selectedStyle === v && <div className="absolute top-1 right-1 bg-pink-500 w-3 h-3 rounded-full"></div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Ảnh User */}
        <div className="bg-gray-800/50 p-4 rounded-xl border border-dashed border-gray-700 hover:border-blue-500 transition-colors">
          <p className="mb-3 font-bold text-blue-400">
             {template.category === 'swap' ? '2. Chọn ảnh mặt của bạn:' : '2. Chọn ảnh cần xử lý:'}
          </p>
          <input 
            type="file" 
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            onChange={e => setUserFile(e.target.files?.[0] || null)} 
          />
        </div>

        <button 
          onClick={handleRun} 
          disabled={loading} 
          className="mt-8 w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? `⏳ ${status}` : '✨ TẠO ẢNH NGAY'}
        </button>
      </div>

      {/* CỘT PHẢI: KẾT QUẢ */}
      <div className="flex-1 bg-black/50 rounded-2xl border border-gray-800 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Hình nền lưới mờ */}
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>

        {result ? (
          <div className="text-center relative z-10 animation-fade-in">
            <p className="text-green-400 font-bold mb-4 text-xl">🎉 Thành công!</p>
            <img src={result} className="max-h-[80vh] max-w-full rounded-lg shadow-2xl border border-gray-700" />
            <button 
                id="download-btn"
                onClick={handleDownload}
                className="mt-6 bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors shadow-lg flex items-center gap-2">
                ⬇️ Tải ảnh về máy
            </button>
          </div>
        ) : (
          <div className="text-center text-gray-600 z-10">
            <div className="text-6xl mb-4 opacity-50">🖼️</div>
            <p className="text-xl">Kết quả sẽ hiện ở đây...</p>
          </div>
        )}
      </div>
    </div>
  );
}