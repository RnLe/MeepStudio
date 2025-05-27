// apps/website/next.config.ts
// This file might look somewhat complex, but it's straightforward.

// These elements are for internal functionality:
// transpilePackages: [
//     "@meepstudio/utils",
//     // add any other @meepstudio/* package
// ],
// serverExternalPackages: ['pino'],

// The rest of the code is to differentiate between the GitHub Pages and local deployments.
// GitHub sets the environment variable GITHUB_ACTIONS to true when running on GitHub Pages, which controls the basePath and assetPrefix.
// For local deployment, these need to be empty strings.

import createMDX from '@next/mdx';
import type { NextConfig } from 'next';

const base = process.env.NEXT_BASE_PATH ?? ''

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {

    // EXPORT RELATED CONFIG
    output: 'export',
    // when exporting to gh pages, prefix all routes/assets with /MeepStudio
    basePath: base,
    assetPrefix: base ? `${base}/` : '',
    trailingSlash: true,         // output /about/index.html instead of about.html
    
    // Make base path available to client-side code
    env: {
        NEXT_PUBLIC_BASE_PATH: base,
    },
    
    // FUNCTIONALITY RELATED CONFIG
    // GitHub Pages requires static export and serves from /MeepStudio, so we need Next to emit all HTML/CSS/JS under that path.
    transpilePackages: [],
    serverExternalPackages: ['pino'],
    turbopack: {
        resolveAlias: {
            canvas: "./empty-module.ts",
        }
    },
    // Webpack fallback for production builds
    webpack(config) {
        // Stub out 'canvas' for client and server bundles via fallback
        config.resolve.fallback = {
            ...(config.resolve.fallback ?? {}),
            canvas: false,
        };
        config.experiments = {
            asyncWebAssembly: true,
            layers: true,            // optional but apparently recommended for module federation in rust
        };
        return config;
    },
    images: {
        unoptimized: true,          // disable image optimization. Necessary for GitHub Pages
    },
    pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
};

const withMDX = createMDX({
    // Add markdown plugins here, as desired
    extension: /\.(md|mdx)$/,           // Include .md files. IMPORTANT: Turbopack doesn't support this yet.
})

// wrap with the MDX plugin
export default withMDX(nextConfig);