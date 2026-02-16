// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  nitro: {
    preset: "cloudflare-module",
    alias: {
      "cloudflare:sockets": "unenv/mock/proxy",
      "pg-native": "unenv/mock/proxy",
    },
    // Ensure runtime-only dependency is bundled for Cloudflare
    externals: {
      inline: ["fast-xml-parser"]
    },
    // Make sure Nitro includes it as a build dependency so it gets inlined
    buildDependencies: {
      inline: ["fast-xml-parser"]
    },
    prerender: {
      autoSubfolderIndex: false,
    },
    compatibilityDate: "2025-07-15",
  },
  devServer: {
    port: 3000,
  },
  modules: ["@nuxtjs/tailwindcss", "@clerk/nuxt"],
  tailwindcss: {
    cssPath: "~/assets/global.css",
  },
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  // Vite configuration to handle dev server requests
  vite: {
    server: {
      // Suppress warnings for directory listing requests
      middlewareMode: false,
    },
  },
});
