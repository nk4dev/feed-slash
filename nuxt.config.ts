// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devServer: {
    port: 3000,
  },
  css: ['~/assets/global.css'],
  modules: ["@prisma/nuxt"],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
})
