import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // dynamicIO: true,
    // authInterrupts: true,
    useCache: true,
  },
  images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "www.lifewire.com",
        },
        {
          protocol: "https",
          hostname: "**",
        },
      ],
    },
}

export default nextConfig
