import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return undefined
          if (id.includes('/marked/')) return 'markdown'
          if (id.includes('/vue/') || id.includes('/@vue/') || id.includes('/vue-router/')) return 'vue'
          return 'vendor'
        },
      },
    },
  },
  server: {
    port: 5173,
  },
})
