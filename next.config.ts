import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

export default withNextIntl({
  allowedDevOrigins: ["127.0.0.1"],
  poweredByHeader: false,
  devIndicators: false,
  typedRoutes: false,
  turbopack: { root: process.cwd() },
  serverExternalPackages: ["@react-pdf/renderer"],
})
