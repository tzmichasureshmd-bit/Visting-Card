import type { NextConfig } from "next";

/**
 * DV CARD — Next.js 16 configuration.
 *
 * Notes (Next 16 breaking changes that shaped this file):
 *  - `cacheComponents` is intentionally NOT enabled. It is opt-in, and when on it
 *    removes `dynamic`/`revalidate`/`dynamicParams`/`fetchCache` segment config and
 *    turns uncached data outside <Suspense> into a build error. For a data-heavy SaaS
 *    with many authenticated routes that trade is not worth it, so we use the
 *    explicit `revalidate` / `fetch` cache model instead.
 *  - `proxy.ts` (formerly `middleware.ts`) runs on the Node.js runtime only.
 *  - `images.qualities` defaults to `[75]` in 16; we opt into a small explicit set.
 */

const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  // Next injects inline bootstrap scripts; a nonce-based policy is the stricter
  // follow-up documented in README "Production checklist".
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://checkout.razorpay.com`,
  `style-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "img-src 'self' blob: data: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Supabase (auth + storage + realtime) and Razorpay checkout.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com",
  "frame-src https://api.razorpay.com https://checkout.razorpay.com",
  "media-src 'self' blob: https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Only in production: in dev this would upgrade http://localhost requests to
  // https and break the dev server.
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,

  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [50, 75, 90],
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    // Next 16: local-IP image optimization is blocked unless explicitly allowed.
    dangerouslyAllowLocalIP: false,
    // The demo and marketing pages ship local SVG artwork. SVGs can carry
    // script, so they are served with the documented sandbox policy that
    // neutralises it. User-uploaded images are rasterised to WebP/AVIF by the
    // upload pipeline, so owner content never takes this path.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  experimental: {
    // Server Actions accept the raw multipart body, so leave headroom over the
    // largest single upload (image cap is enforced separately in the upload path).
    serverActions: {
      bodySizeLimit: "12mb",
    },
    // Razorpay's SDK is Node-only; keep it out of the server bundle.
    optimizePackageImports: ["lucide-react", "date-fns"],
  },

  // `razorpay` is not in Next's default serverExternalPackages list.
  serverExternalPackages: ["razorpay"],

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
      {
        // Service workers must never be served stale.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;