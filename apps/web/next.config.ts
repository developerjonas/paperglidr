import type { NextConfig } from "next";
import { allowedImageHosts } from "./src/lib/imageHosts";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // dynamicIO: true,
    // authInterrupts: true,
    useCache: true,
  },
  images: {
    // Only known hosts — "**" turned /_next/image into an open proxy.
    // Add hosts via NEXT_PUBLIC_IMAGE_HOSTS; see src/lib/imageHosts.ts.
    remotePatterns: allowedImageHosts.map(hostname => ({
      protocol: "https" as const,
      hostname,
    })),
  },
};

export default nextConfig;
