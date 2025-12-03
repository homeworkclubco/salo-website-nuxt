// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  devServer: {
    port: 3001,
  },

  // Server-side rendering configuration for Cloudflare Workers
  nitro: {
    preset: "cloudflare-module",
    // Hybrid rendering: static generation for most pages, dynamic for preview
    prerender: {
      crawlLinks: true,
      routes: [
        // Pre-render homepage and all static pages
        "/",
        // Preview routes remain dynamic (not listed here)
      ],
    },
  },

  hooks: {
    "nitro:build:public-assets": (nitro) => {
      // Remove _redirects file as we use wrangler's not_found_handling instead
      const fs = require("fs");
      const path = require("path");
      const redirectsPath = path.join(
        nitro.options.output.publicDir,
        "_redirects"
      );
      if (fs.existsSync(redirectsPath)) {
        fs.unlinkSync(redirectsPath);
      }
    },
  },

  build: {
    transpile: ["@payloadcms/live-preview"],
  },
  runtimeConfig: {
    // Private keys (server-only, not exposed to client)
    apiKey: process.env.NUXT_API_KEY || "",
    // Public keys (exposed to client)
    public: {
      payloadUrl:
        process.env.NUXT_PUBLIC_PAYLOAD_URL || "http://localhost:3000",
    },
  },
  routeRules: {
    // Static pages - pre-render at build time
    "/": { prerender: true },
    // Preview routes - dynamic for live preview functionality
    "/preview/**": {
      headers: {
        // Allow Payload CMS to embed preview pages in iframe
        "X-Frame-Options": `ALLOW-FROM ${
          process.env.NUXT_PUBLIC_PAYLOAD_URL || "http://localhost:3000"
        }`,
        "Content-Security-Policy": `frame-ancestors 'self' ${
          process.env.NUXT_PUBLIC_PAYLOAD_URL || "http://localhost:3000"
        }`,
      },
      // Keep preview routes dynamic (no prerender)
      prerender: false,
    },
  },
});
