import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true }, // Tiêu đề
  slug: { type: String, required: true, unique: true }, // Đường dẫn (VD: cach-ve-anh-dep)
  content: { type: String, required: true }, // Nội dung bài viết (HTML hoặc Markdown)
  thumbnail: { type: String }, // Ảnh đại diện bài viết
  prompts: [{ type: String }],
  excerpt: { type: String }, // Mô tả ngắn
  author: { type: String, default: "Admin" },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// Nếu đã có model Post thì dùng lại, chưa có thì tạo mới
export default mongoose.models.Post || mongoose.model("Post", PostSchema);