import type { NextConfig } from "next";

const apiUrl = process.env.API_URL ?? "http://localhost:9000/api";

const nextConfig: NextConfig = {
  typedRoutes: true,
  poweredByHeader: false,
  transpilePackages: ["@ecom/sdk", "@ecom/shared"],
  images: {
    // Seed-data placeholders; product uploads move to S3/CloudFront in Phase 5.
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
  // On AWS, CloudFront sends /api/* to the API before requests reach Next.js.
  // Locally this proxy gives the browser the same single-domain setup.
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];
    return [{ source: "/api/:path*", destination: `${apiUrl}/:path*` }];
  },
};

export default nextConfig;
