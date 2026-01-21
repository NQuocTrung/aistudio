import mongoose, { Schema, model, models } from 'mongoose';

const HistorySchema = new Schema({
  // Link ảnh kết quả
  resultImage: { type: String, required: true },
  
  // Link ảnh gốc 
  originalImage: { type: String },
  
  // ID của mẫu
  templateId: { type: String },
  
  userId: { type: String, default: 'guest' }, 
  isPublic: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now, expires: 86400 },
 
});

const History = models.History || model('History', HistorySchema);
export default History;