import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync } from 'fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  plugins: [vue()],
  base: '/TaxesTimer/',
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
})
