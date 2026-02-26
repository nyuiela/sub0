import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // turbopack: {
  //   root: path.resolve(__dirname, ".."),
  // },
  images: {
    // domains: ["localhost", "assets.thirdweb.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "*.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
      },
      {
        protocol: "https",
        hostname: "*.thirdweb.com",
      }
    ],
  },
};

export default nextConfig;
