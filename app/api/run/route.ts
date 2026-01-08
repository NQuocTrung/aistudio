import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { connectToDatabase } from '@/lib/mongodb';
import History from '@/models/History';
import User from '@/models/User'; 
import { currentUser } from '@clerk/nextjs/server';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, mode, images, model: oldModel, input: oldInput, templateId, userUrl } = body;
    const clerkUser = await currentUser();
    
    // --- 1. KIỂM TRA QUYỀN & TIỀN ---
    const isAdmin = clerkUser?.publicMetadata?.role === 'admin';
    let dbUser = null;

    if (clerkUser) {
        await connectToDatabase();
        dbUser = await User.findOne({ clerkId: clerkUser.id });
        if (!isAdmin && dbUser && dbUser.credits <= 0) {
            return NextResponse.json({ error: "Bạn đã hết Xu. Vui lòng nạp thêm!" }, { status: 403 });
        }
    } else {
        return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
    }

    // --- 2. CẤU HÌNH MODEL ---
    let modelId = "";
    let finalInput = {};
    let logMessage = "";

    // 👉 TRƯỜNG HỢP A: Chạy từ trang SÁNG TẠO (Có 'mode')
    if (mode) {
        // 1. 🍌 NANO BANANA (Sửa ảnh thông minh)
        if (mode === 'nano-banana') {
            modelId = "google/nano-banana:f0a9d34b12ad1c1cd76269a844b218ff4e64e128ddaba93e15891f47368958a0";
            if (!images || images.length === 0) return NextResponse.json({ error: "Thiếu ảnh đầu vào" }, { status: 400 });
            finalInput = {
                prompt: prompt,
                image_input: images,
                output_format: "jpg"
            };
            logMessage = `🍌 Nano Banana`;
        } 
        // 2. 🖼️ IMAGE-TO-IMAGE (SDXL)
        else if (mode === 'image-to-image') {
            modelId = "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b715957eeb93f53";
            const firstImage = (images && images.length > 0) ? images[0] : null;
            if (!firstImage) return NextResponse.json({ error: "Thiếu ảnh gốc" }, { status: 400 });
            finalInput = {
                prompt: prompt,
                image: firstImage,
                strength: 0.75,
                num_inference_steps: 40
            };
            logMessage = "🖼️ Image-to-Image";
        }
        // 3. 🔍 UPSCALE (LÀM NÉT ẢNH) - MỚI THÊM ✅
        else if (mode === 'upscale') {
            modelId = "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73ab4151064972240217e";
            const firstImage = (images && images.length > 0) ? images[0] : null;
            if (!firstImage) return NextResponse.json({ error: "Thiếu ảnh gốc" }, { status: 400 });
            
            finalInput = {
                image: firstImage,
                scale: 2, // Phóng to gấp 2 lần (hoặc 4 tùy thích)
                face_enhance: true // Tự động làm đẹp mặt người
            };
            logMessage = "🔍 Upscale (Real-ESRGAN)";
        }
        // 4. ✂️ REMOVE BG (TÁCH NỀN) - MỚI THÊM ✅
        else if (mode === 'remove-bg') {
            modelId = "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003";
            const firstImage = (images && images.length > 0) ? images[0] : null;
            if (!firstImage) return NextResponse.json({ error: "Thiếu ảnh gốc" }, { status: 400 });

            finalInput = {
                image: firstImage
            };
            logMessage = "✂️ Remove Background";
        }
        // 5. ✨ TEXT-TO-IMAGE (Mặc định)
        else {
            modelId = "black-forest-labs/flux-schnell";
            finalInput = {
                prompt: prompt,
                aspect_ratio: "1:1",
                output_format: "jpg",
                output_quality: 90,
            };
            logMessage = "✨ Text-to-Image";
        }
    } 
    // 👉 TRƯỜNG HỢP B: Chạy từ trang MẪU CŨ
    else if (oldModel) {
        modelId = oldModel;
        finalInput = oldInput;
        logMessage = `📄 Template: ${templateId}`;
    } else {
        return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
    }

    console.log(`🚀 Đang chạy: ${logMessage}`);

    // --- 3. GỌI REPLICATE ---
    const output = await replicate.run(modelId as any, { input: finalInput });

    // --- 4. XỬ LÝ KẾT QUẢ ---
    let finalUrl = null;
    if (Array.isArray(output) && output.length > 0) {
        finalUrl = String(output[0]);
    } else {
        finalUrl = String(output);
    }

    if (!finalUrl || !finalUrl.startsWith('http')) {
        return NextResponse.json({ error: "AI không trả về link ảnh hợp lệ." }, { status: 500 });
    }

    // --- 5. LƯU & TRỪ TIỀN ---
    try {
        await connectToDatabase();
        if (dbUser && !isAdmin) {
            dbUser.credits = dbUser.credits - 1;
            await dbUser.save();
        }
        await History.create({
            userId: clerkUser.id,
            resultImage: finalUrl,
            originalImage: mode ? (mode === 'nano-banana' ? `${images?.length} ảnh` : '1 ảnh') : (userUrl || ''),
            prompt: prompt || (oldInput ? oldInput.prompt : ''), 
            templateId: templateId || mode || 'custom',
            createdAt: new Date(),
        });
    } catch (e) { console.error("Lỗi lưu DB:", e); }

    return NextResponse.json({ result: finalUrl });

  } catch (error: any) {
    console.error("Lỗi Server:", error);
    return NextResponse.json({ error: error.message || "Lỗi xử lý" }, { status: 500 });
  }
}