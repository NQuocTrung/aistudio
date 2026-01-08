import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  // ID của Clerk (Cái này quan trọng nhất để khớp với bên đăng nhập)
  clerkId: { type: String, required: true, unique: true },
  
  email: { type: String, required: true },
  
  // 💰 TÀI SẢN: Mặc định tạo mới là tặng 10 xu
  credits: { type: Number, default: 10 },
  
  // Hạng thành viên: 'free' hoặc 'pro' (để sau này tính năng VIP)
  plan: { type: String, default: 'free' },
  
  createdAt: { type: Date, default: Date.now }
});

const User = models.User || model('User', UserSchema);
export default User;