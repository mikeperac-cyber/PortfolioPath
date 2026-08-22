import createNextIntlPlugin from "next-intl/plugin";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default bundleAnalyzer(
  withNextIntl({
    allowedDevOrigins: ["127.0.0.1"],
    poweredByHeader: false,
    devIndicators: false,
    typedRoutes: false,
    turbopack: { root: process.cwd() },
    serverExternalPackages: ["@react-pdf/renderer"],
    compress: true,
    images: {
      formats: ["image/avif", "image/webp"],
      remotePatterns: [
        {
          protocol: "https",
          hostname: "**.supabase.co",
        },
        {
          protocol: "https",
          hostname: "images.unsplash.com",
        },
      ],
    },
    experimental: {
      optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
    },
  })
);
