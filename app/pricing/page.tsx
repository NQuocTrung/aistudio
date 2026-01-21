'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner'; 


const PACKAGES = [
  { id: 'starter', name: 'Gói Khởi Động', credits: 10, price: '20.000đ', color: 'from-blue-500 to-cyan-400' },
  { id: 'pro', name: 'Gói Sáng Tạo', credits: 50, price: '50.000đ', color: 'from-purple-500 to-pink-500', popular: true },
  { id: 'expert', name: 'Gói Chuyên Gia', credits: 200, price: '100.000đ', color: 'from-yellow-400 to-orange-500' },
];

export default function PricingPage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<any>(null); 

  // Hàm xử lý thanh toán 
  const handlePayment = async () => {
    if (!selectedPkg) return;
    
    setLoading(true);
    const toastId = toast.loading("Đang xác thực giao dịch...");

    try {
        // Gọi API nạp tiền thật
        const res = await fetch('/api/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                amount: selectedPkg.credits,
                packageId: selectedPkg.id
            })
        });

        const data = await res.json();

        if (res.ok) {
            toast.dismiss(toastId);
            toast.success(`Nạp thành công +${selectedPkg.credits} Xu!`);
            setSelectedPkg(null); 
            
            
            setTimeout(() => window.location.reload(), 1500);
        } else {
            throw new Error(data.error);
        }

    } catch (error) {
        toast.dismiss(toastId);
        toast.error("Giao dịch thất bại. Vui lòng thử lại!");
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col">
      
      {/* Header*/}
      <header className="p-6 border-b border-gray-800 flex justify-between items-center">
         <Link href="/" className="text-xl font-bold">← Quay về</Link>
         <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            Nạp Xu Sáng Tạo 💎
         </h1>
         <div className="w-20"></div> 
      </header>

      <main className="flex-1 max-w-5xl mx-auto p-6 w-full">
         <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold mb-4">Chọn gói phù hợp với bạn</h2>
            <p className="text-gray-400">Mở khóa sức mạnh AI không giới hạn</p>
         </div>

         {/* Danh sách gói */}
         <div className="grid md:grid-cols-3 gap-8">
            {PACKAGES.map((pkg) => (
                <div key={pkg.id} className="relative bg-[#1a1a1a] rounded-2xl p-8 border border-gray-800 hover:border-gray-600 transition hover:-translate-y-2 shadow-xl flex flex-col">
                    {pkg.popular && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                            PHỔ BIẾN NHẤT 🔥
                        </div>
                    )}
                    
                    <h3 className="text-xl font-bold text-gray-300 mb-2">{pkg.name}</h3>
                    <div className="text-4xl font-extrabold mb-4">{pkg.price}</div>
                    <div className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${pkg.color} mb-6`}>
                        +{pkg.credits} Xu
                    </div>

                    <ul className="space-y-3 mb-8 text-gray-400 text-sm flex-1">
                        <li>✅ Tạo ảnh chất lượng cao</li>
                        <li>✅ Tốc độ xử lý ưu tiên</li>
                        <li>✅ Không giới hạn tính năng</li>
                    </ul>

                    <button 
                        onClick={() => {
                            if (!user) return toast.error("Vui lòng đăng nhập để nạp tiền!");
                            setSelectedPkg(pkg);
                        }}
                        className={`w-full py-3 rounded-xl font-bold bg-gradient-to-r ${pkg.color} text-black hover:opacity-90 transition shadow-lg`}
                    >
                        Chọn gói này
                    </button>
                </div>
            ))}
         </div>
      </main>

      {selectedPkg && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-sm w-full border border-gray-700 shadow-2xl animate-in zoom-in-95 duration-200">
                <h3 className="text-xl font-bold text-center mb-2">Xác nhận thanh toán</h3>
                <p className="text-center text-gray-400 text-sm mb-6">
                    Quét mã QR để thanh toán gói <span className="text-yellow-400 font-bold">{selectedPkg.name}</span>
                </p>

               
                <div className="bg-white p-4 rounded-xl mb-6 mx-auto w-48 h-48 flex items-center justify-center">
                     
                     <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MoMo_Fake_Payment_${selectedPkg.price}`} className="w-full h-full" />
                </div>

                <p className="text-xs text-center text-gray-500 italic mb-6">
                    (Đây là chế độ giả lập. Bạn không cần chuyển tiền thật, chỉ cần bấm nút bên dưới)
                </p>

                <div className="flex gap-3">
                    <button 
                        onClick={() => setSelectedPkg(null)}
                        className="flex-1 py-3 bg-gray-800 rounded-xl font-bold hover:bg-gray-700 text-gray-300 transition"
                    >
                        Hủy bỏ
                    </button>
                    <button 
                        onClick={handlePayment}
                        disabled={loading}
                        className="flex-1 py-3 bg-yellow-500 rounded-xl font-bold text-black hover:bg-yellow-400 transition flex justify-center items-center gap-2"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : '✅ Đã chuyển tiền'}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}