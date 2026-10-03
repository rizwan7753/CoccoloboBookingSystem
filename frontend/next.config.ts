import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Shared cPanel hosting caps process/thread counts (CloudLinux LVE) well
  // below what Next.js's default worker pool assumes from the reported CPU
  // count, causing "pthread_create: Resource temporarily unavailable"
  // during the page-data-collection build phase. Keep the build single-threaded.
  experimental: {
    cpus: 2,
    workerThreads: false,
  },
  // The restaurant section was renamed Coco Grill — keep old links, bookmarks
  // and search results working.
  async redirects() {
    return [
      { source: "/restaurant", destination: "/coco-grill", permanent: true },
      { source: "/restaurant/:path*", destination: "/coco-grill/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
