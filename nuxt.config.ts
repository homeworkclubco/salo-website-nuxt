// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  devServer: {
    port: 3001,
  },

  // Static generation configuration for Cloudflare deployment
  nitro: {
    preset: 'cloudflare-pages',
    static: true,
    prerender: {
      crawlLinks: true,
      routes: ['/'],
      ignore: ['/preview']
    }
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
    },
  },
});
