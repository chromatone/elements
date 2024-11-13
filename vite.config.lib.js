// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({

  build: {
    outDir: 'lib',
    copyPublicDir: false,
    lib: {
      formats: ['es'],
      entry: {
        midi: resolve(__dirname, 'composables/useMidi.js'),
        params: resolve(__dirname, 'composables/useParams.js'),
        params: resolve(__dirname, 'composables/useRange.js'),
      },
      name: 'Elements',
    },
    rollupOptions: {
      external: ['vue', 'webmidi', "@elemaudio/core",
        "@elemaudio/web-renderer", "tonal",],
      output: {
        globals: { vue: 'Vue', webmidi: 'WebMidi', tonal: 'Tonal' },
      }
    },
  },
})