// models/Template.ts
import mongoose, { Schema, model, models } from 'mongoose';

const TemplateSchema = new Schema({
  name: { type: String, required: true },       // Tên mẫu (VD: Vest Nam)
  mainImage: { type: String, required: true },  // Ảnh bìa hiển thị
  category: { type: String, required: true },   // Loại: 'swap' (ghép mặt) hoặc 'enhance' (làm nét)
  modelId: { type: String, required: true },    // ID của Model AI (Codeplugtech, Real-ESRGAN...)
  variants: [{ type: String }],                 // Danh sách các ảnh biến thể (Style)
  isHot: { type: Boolean, default: false },     // Đánh dấu là HOT Trend
  createdAt: { type: Date, default: Date.now }  // Ngày tạo
});

// Nếu model đã có thì dùng lại, chưa có thì tạo mới (Tránh lỗi overwrite khi hot reload)
const Template = models.Template || model('Template', TemplateSchema);

export default Template;
