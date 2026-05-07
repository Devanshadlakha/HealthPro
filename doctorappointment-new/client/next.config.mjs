/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8081",
    },
    // ESLint warnings/errors should not block production builds for this demo.
    // Type-checking still runs — that's the load-bearing safety net.
    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
