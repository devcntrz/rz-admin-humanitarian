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
  // Keep pdfkit outside the Next bundle so AFM font files resolve from node_modules
  serverExternalPackages: ["pdfkit", "fontkit", "linebreak", "png-js"],
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/pdfkit/js/data/**/*"],
  },
};

export default nextConfig;
