/** @type {import('next').NextConfig} */
const nextConfig = {
  // Chỉ giữ lại cấu hình ảnh
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;