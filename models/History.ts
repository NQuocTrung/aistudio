import mongoose, { Schema, model, models } from 'mongoose';

const HistorySchema = new Schema({
  // Link ảnh kết quả (Quan trọng nhất)
  resultImage: { type: String, required: true },
  
  // Link ảnh gốc người dùng up lên (để họ nhớ là họ đã dùng ảnh nào)
  originalImage: { type: String },
  
  // ID của mẫu đã dùng (để biết dùng mẫu nào)
  templateId: { type: String },
  
  // Tạm thời chưa có đăng nhập thì để trống, sau này sẽ lưu ID người dùng vào đây
  userId: { type: String, default: 'guest' }, 
  isPublic: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now, expires: 86400 },
 
});

const History = models.History || model('History', HistorySchema);
export default History;