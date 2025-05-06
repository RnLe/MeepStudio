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

import { NextConfig as NextConfigType } from "next"
const base = process.env.NEXT_BASE_PATH ?? ''

/** @type {import('next').NextConfig} */
interface MeepNextConfig extends NextConfigType {
    transpilePackages: string[]
    serverExternalPackages: string[]
}

type NextConfigPhaseFunction = (phase: string) => MeepNextConfig

const moduleExports: NextConfigPhaseFunction = (phase) => {

        return {
            // EXPORT RELATED CONFIG
            output: 'export',
            // when exporting to gh pages, prefix all routes/assets with /MeepStudio
            basePath: base,
            assetPrefix: base ? `${base}/` : '',
            trailingSlash: true,         // output /about/index.html instead of about.html
            
            // FUNCTIONALITY RELATED CONFIG
            // GitHub Pages requires static export and serves from /MeepStudio, so we need Next to emit all HTML/CSS/JS under that path.
            transpilePackages: [
                    "@meepstudio/utils",
                    "@meepstudio/ui",
                    "@meepstudio/types",
                    "@meepstudio/providers"
            ],
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

                return config;
            },
        }
}

module.exports = moduleExports
