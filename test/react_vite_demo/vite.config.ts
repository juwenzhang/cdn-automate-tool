import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
// @ts-ignore
import { cdnAutomateVite } from "cdn-automate-tool"

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['react', 'react-dom']
    }
  },
  plugins: [
    react(),
    // @ts-ignore
    cdnAutomateVite({
      cdnList: [
        {
          name: 'react',
          main: '//cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js',
          fallback: '//cdn.bootcdn.net/ajax/libs/react/18.2.0/umd/react.production.min.js',
          type: "script",
          defer: true
        },
        {
          name: 'react-dom',
          main: '//cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js',
          fallback: '//cdn.bootcdn.net/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
          type: "script",
          defer: true
        }
      ],
      isProd: true
    }),
  ],
})
