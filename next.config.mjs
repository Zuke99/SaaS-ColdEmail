/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
    // Keep Dodo SDK out of webpack chunks (avoids missing chunk errors in dev)
    serverComponentsExternalPackages: ["dodopayments", "@dodopayments/core"],
  },
};

export default nextConfig;
