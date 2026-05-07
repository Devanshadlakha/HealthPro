/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8081",
    },
};

export default nextConfig;
