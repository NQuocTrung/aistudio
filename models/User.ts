import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  // ID của Clerk 
  clerkId: { type: String, required: true, unique: true },
  
  email: { type: String, required: true },
  
  //  tặng 10 xu
  credits: { type: Number, default: 10 },
  
  plan: { type: String, default: 'free' },
  
  createdAt: { type: Date, default: Date.now },
  lastDailyBonus: { type: Date, default: Date.now },
});

const User = models.User || model('User', UserSchema);
export default User; 