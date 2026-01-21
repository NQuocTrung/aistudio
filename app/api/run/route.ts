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
    
    // Lấy thông tin 
    const clerkUser = await currentUser();
    
    // 1. LOGIC KIỂM TRA QUYỀN 
    const isAdmin = clerkUser?.publicMetadata?.role === 'admin';
    let dbUser = null;

    if (clerkUser) {
        await connectToDatabase();
        dbUser = await User.findOne({ clerkId: clerkUser.id });
        
        if (dbUser && !isAdmin) {
            //  10 LƯỢT MỖI NGÀY
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); 
            
        
            if (!dbUser.lastDailyBonus || new Date(dbUser.lastDailyBonus) < today) {
                // Nếu xu đang dưới 10, Hồi lại thành 10 
                if (dbUser.creditBalance < 10) {
                    dbUser.creditBalance = 10;
                }
                
                dbUser.lastDailyBonus = now;
                await dbUser.save();
                console.log(`🔄 Đã hồi lượt daily cho user: ${dbUser.email}`);
            }

            //  KIỂM TRA HẾT LƯỢT
            if (dbUser.creditBalance <= 0) {
                return NextResponse.json({ 
                    error: "Hết 10 lượt hôm nay! Hãy quay lại vào ngày mai hoặc nâng cấp VIP." 
                }, { status: 403 });
            }
        }
    }
   

    // 2. CẤU HÌNH MODEL 
    let modelId = "";
    let finalInput = {};
    let logMessage = "";

    if (mode) {
        if (mode === 'nano-banana') {
            modelId = "google/nano-banana:f0a9d34b12ad1c1cd76269a844b218ff4e64e128ddaba93e15891f47368958a0";
            if (!images || images.length === 0) return NextResponse.json({ error: "Thiếu ảnh đầu vào" }, { status: 400 });
            finalInput = { prompt: prompt, image_input: images, output_format: "jpg" };
            logMessage = `🍌 Nano Banana`;
        } 
        else if (mode === 'image-to-image') {
            modelId = "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b715957eeb93f53";
            const firstImage = images?.[0];
            if (!firstImage) return NextResponse.json({ error: "Thiếu ảnh gốc" }, { status: 400 });
            finalInput = { prompt: prompt, image: firstImage, strength: 0.75, num_inference_steps: 40 };
            logMessage = "🖼️ Image-to-Image";
        }
        else if (mode === 'upscale') {
            
            modelId = "sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56";
            const firstImage = images?.[0];
            if (!firstImage) return NextResponse.json({ error: "Thiếu ảnh gốc" }, { status: 400 });
            finalInput = { image: firstImage, upscale: 2, face_upsample: true, background_enhance: true, codeformer_fidelity: 0.7 };
            logMessage = "🔍 Upscale (CodeFormer)";
        }
        else if (mode === 'remove-bg') {
            modelId = "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003";
            const firstImage = images?.[0];
            if (!firstImage) return NextResponse.json({ error: "Thiếu ảnh gốc" }, { status: 400 });
            finalInput = { image: firstImage };
            logMessage = "✂️ Remove Background";
        }
        else {
            modelId = "black-forest-labs/flux-schnell";
            finalInput = { prompt: prompt, aspect_ratio: "1:1", output_format: "jpg", output_quality: 90 };
            logMessage = "✨ Text-to-Image";
        }
    } 
    else if (oldModel) {
        modelId = oldModel;
        finalInput = oldInput;
        logMessage = `📄 Template: ${templateId}`;
    } else {
        return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
    }

    console.log(`🚀 Chạy: ${logMessage} | User: ${clerkUser ? clerkUser.id : 'Guest'}`);

    // 3. GỌI REPLICATE
    const output = await replicate.run(modelId as any, { input: finalInput });

    // 4. XỬ LÝ KẾT QUẢ
    let finalUrl = null;
    if (Array.isArray(output) && output.length > 0) finalUrl = String(output[0]);
    else finalUrl = String(output);

    if (!finalUrl || !finalUrl.startsWith('http')) {
        return NextResponse.json({ error: "Lỗi AI: Không tạo được ảnh." }, { status: 500 });
    }

    // --- 5. LƯU 
    if (clerkUser) {
        try {
            await connectToDatabase();
            if (dbUser && !isAdmin) {
                // Trừ 1 xu
                dbUser.creditBalance = dbUser.creditBalance - 1;
                await dbUser.save();
            }
            // Lưu lịch sử
            await History.create({
                userId: clerkUser.id,
                resultImage: finalUrl,
                originalImage: mode ? (mode === 'nano-banana' ? `${images?.length} ảnh` : '1 ảnh') : (userUrl || ''),
                prompt: prompt || (oldInput ? oldInput.prompt : ''), 
                templateId: templateId || mode || 'custom',
                createdAt: new Date(),
            });
        } catch (e) { console.error("Lỗi lưu DB:", e); }
    }

    return NextResponse.json({ result: finalUrl });

  } catch (error: any) {
    console.error("Lỗi Server:", error);
    return NextResponse.json({ error: error.message || "Lỗi xử lý" }, { status: 500 });
  }
}