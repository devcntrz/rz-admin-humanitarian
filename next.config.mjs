/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: "standalone",
  // Bundle local font files with PDF API routes (real paths — avoids pnpm symlink deploy errors)
  outputFileTracingIncludes: {
    "/api/site-reports/[id]/pdf": ["./assets/fonts/**/*"],
    "/api/distributions/[id]/pdf": ["./assets/fonts/**/*"],
  },
};

export default nextConfig;
