// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  nitro: {
    prerender: {
      autoSubfolderIndex: false,
    },
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
