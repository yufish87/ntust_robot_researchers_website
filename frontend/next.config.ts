import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [55, 65, 75],
  },
};

export default nextConfig;
