// apps/website/next.config.ts
import { NextConfig } from "next";

const config: NextConfig = {
    // Tell next.js to use packages outside of the root directory
    transpilePackages: [
        "@meepstudio/utils",
        // add any other @meepstudio/* package you import
    ],
    serverExternalPackages: ['pino'],
};

export default config;
