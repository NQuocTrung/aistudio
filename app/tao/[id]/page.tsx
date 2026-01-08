'use client';
import { useState, useEffect, use } from 'react';
import { useUser } from '@clerk/nextjs';


interface Template {
  _id: string;
  name: string;
  modelId: string;
  configParams: string;
  mainImage: string;
  variants?: string[]; 
}

export default function CreatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isSignedIn } = useUser();

  const [template, setTemplate] = useState<Template | null>(null);
  
  const [selectedTemplateImage, setSelectedTemplateImage] = useState<string>(""); 

  const [userFile, setUserFile] = useState<File | null>(null);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // thong tin mẫu từ API
  useEffect(() => {
    if (!id) return;
    fetch(`/api/templates?id=${id}`)
      .then(res => res.json())
      .then(data => {
        const tmpl = Array.isArray(data) ? data[0] : data;
        if (tmpl) {
             setTemplate(tmpl);
             setSelectedTemplateImage(tmpl.mainImage);
        }
      })
      .catch(err => console.error(err));
  }, [id]);

    // upload ảnh lên Cloudinary
  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || 'ml_default');
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      return data.secure_url;
    } catch (error) {
      alert("Lỗi upload ảnh! Kiểm tra mạng.");
      return null;
    }
  };

  // tải ảnh
  const forceDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob(); // Chuyển dạng Blob
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `qt-studio-${Date.now()}.png`; 
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(error);
      window.open(imageUrl, '_blank');
    }
  };

  const handleRun = async () => {
    if (!userFile) return alert("Vui lòng chọn ảnh khuôn mặt của bạn!");
    if (!template) return;

    setLoading(true);
    setResult("");
    
    try {
        const userUrl = await uploadToCloudinary(userFile);
        if (!userUrl) { setLoading(false); return; }

        let aiInput = {};
        try {
            let configStr = template.configParams;
            
            
            configStr = configStr.replace(/USER_IMAGE/g, userUrl);
            configStr = configStr.replace(/TEMPLATE_IMAGE/g, selectedTemplateImage);
            
            aiInput = JSON.parse(configStr);
        } catch (jsonError) {
            alert("Lỗi cấu hình JSON trong Admin!");
            setLoading(false);
            return;
        }

        const res = await fetch('/api/run', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                model: template.modelId, 
                input: aiInput,
                templateId: template._id,
                userUrl: userUrl 
            })
        });

        const data = await res.json();

        if (data.error) {
             if (data.error === 'E_NO_CREDITS') {
                alert("😭 Bạn đã hết Xu rồi!");
            } else {
                alert("Lỗi AI: " + JSON.stringify(data.error));
            }
        } else if (data.result) {
            setResult(data.result);
        }

    } catch (error) {
        alert("Lỗi kết nối Server.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-10 font-sans flex justify-center">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* CẤU HÌNH */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 h-fit">
            <div className="flex justify-between mb-6">
                <a href="/" className="text-gray-400 font-bold hover:text-white">← Quay lại</a>
            </div>

            {template ? (
                <>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-6">
                        {template.name}
                    </h1>

                    {/* ảnh đầu vào */}
                    <div className="mb-6">
                        <label className="block text-gray-400 mb-2 font-bold">1. Ảnh khuôn mặt của bạn:</label>
                        <input type="file" onChange={(e) => setUserFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-blue-600 file:text-white hover:file:bg-blue-700"/>
                        {userFile && <div className="mt-2 text-green-400 text-xs">✅ Đã chọn: {userFile.name}</div>}
                    </div>

                    {/* CHỌN MẪU */}
                    <div className="mb-6">
                         <label className="block text-gray-400 mb-2 font-bold">2. Chọn kiểu dáng (Mẫu):</label>
                         
                         {/* ảnh mẫu lớn */}
                        <div className="mb-3 border-2 border-pink-500 rounded-lg overflow-hidden w-fit">
                             <img src={selectedTemplateImage} className="h-48 object-cover" />
                        </div>

                        {/* các mẫu con */}
                        {template.variants && template.variants.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {/* ảnh chính */}
                                <img 
                                    src={template.mainImage} 
                                    onClick={() => setSelectedTemplateImage(template.mainImage)}
                                    className={`w-16 h-16 rounded-md cursor-pointer object-cover border-2 ${selectedTemplateImage === template.mainImage ? 'border-pink-500' : 'border-gray-700 hover:border-white'}`}
                                />
                                {/* ảnh phụ */}
                                {template.variants.map((v, idx) => (
                                    <img 
                                        key={idx}
                                        src={v} 
                                        onClick={() => setSelectedTemplateImage(v)}
                                        className={`w-16 h-16 rounded-md cursor-pointer object-cover border-2 ${selectedTemplateImage === v ? 'border-pink-500' : 'border-gray-700 hover:border-white'}`}
                                    />
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Bấm vào các ảnh nhỏ để đổi kiểu dáng.</p>
                    </div>

                    <button 
                        onClick={handleRun} 
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 transition'}`}
                    >
                        {loading ? "⏳ Đang xử lý AI..." : "🚀 TẠO ẢNH NGAY (-1 Xu)"}
                    </button>
                </>
            ) : (
                <div className="text-center text-gray-500 py-10">⏳ Đang tải thông tin mẫu...</div>
            )}
        </div>

        {/*  KẾT QUẢ */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl min-h-[500px] flex flex-col items-center justify-center p-4">
            {loading ? (
                <div className="text-center animate-pulse">
                    <div className="text-6xl mb-4">🎨</div>
                    <p className="text-gray-400">Đang xử lý... Đợi xíu nhé!</p>
                </div>
            ) : result ? (
                <div className="text-center w-full">
                    <p className="text-green-400 font-bold mb-4">🎉 Xong rồi nè!</p>
                    <img src={result} className="max-w-full max-h-[600px] rounded-lg shadow-2xl mx-auto border border-gray-700 mb-6" />
                    
                   
                    <button 
                        onClick={() => forceDownload(result)}
                        className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-full font-bold hover:bg-green-700 transition shadow-lg hover:shadow-green-500/30"
                    >
                        ⬇️ Tải ảnh về máy
                    </button>
                </div>
            ) : (
                <div className="text-gray-600 text-center">
                    <div className="text-4xl mb-2">🖼️</div>
                    <p>Kết quả sẽ hiện ở đây...</p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}