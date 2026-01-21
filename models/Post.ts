import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true }, 
  slug: { type: String, required: true, unique: true }, 
  content: { type: String, required: true }, 
  thumbnail: { type: String }, 
  prompts: [{ type: String }],
  excerpt: { type: String }, 
  author: { type: String, default: "Admin" },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});


export default mongoose.models.Post || mongoose.model("Post", PostSchema);