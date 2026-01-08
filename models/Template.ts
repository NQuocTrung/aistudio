// models/Template.ts
import mongoose, { Schema, model, models } from 'mongoose';

const TemplateSchema = new Schema({
  name: { type: String, required: true },
  mainImage: { type: String, required: true },
  category: { type: String, required: true },
  label: { type: String, default: 'Công cụ AI' }, // Tên hiển thị (VD: 🎭 Ghép mặt)
  color: { type: String, default: 'bg-blue-500' }, // Màu sắc hiển thị
  modelId: { type: String, required: true },
  variants: [{ type: String }],
  isHot: { type: Boolean, default: false },
  
  // 👇 THÊM DÒNG NÀY VÀO (Không ảnh hưởng gì cái cũ cả)
  configParams: { type: String, default: '{}' }, 
  
  createdAt: { type: Date, default: Date.now }
});

// Dòng này giúp Next.js không báo lỗi "OverwriteModelError"
// Nó có nghĩa là: "Nếu có model tên Template rồi thì dùng lại, chưa có thì tạo mới"
const Template = models.Template || model('Template', TemplateSchema);

export default Template;
