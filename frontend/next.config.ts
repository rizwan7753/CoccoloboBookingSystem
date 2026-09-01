import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Shared cPanel hosting caps process/thread counts (CloudLinux LVE) well
  // below what Next.js's default worker pool assumes from the reported CPU
  // count, causing "pthread_create: Resource temporarily unavailable"
  // during the page-data-collection build phase. Keep the build single-threaded.
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
};

export default nextConfig;
