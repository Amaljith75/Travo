/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static admin SPA: all data access happens in the browser through
  // Supabase (RLS-protected) or the demo adapter, so it can be hosted anywhere.
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  transpilePackages: ['@travo/core'],
  reactStrictMode: true,
};
export default nextConfig;
