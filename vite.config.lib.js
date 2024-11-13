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
        range: resolve(__dirname, 'composables/useRange.js'),
        scale: resolve(__dirname, 'composables/useScale.js'),
        synth: resolve(__dirname, 'composables/useSynth.js'),
        voices: resolve(__dirname, 'composables/useVoices.js'),
        index: resolve(__dirname, 'composables/index.js'),
      },
      name: 'Elements',
    },
    rollupOptions: {
      external: ['vue', 'webmidi', "@elemaudio/core",
        "@elemaudio/web-renderer", "tonal", '@vueuse/core', '@vueuse/gesture'],
      output: {
        globals: { vue: 'Vue', webmidi: 'WebMidi', tonal: 'Tonal' },
      }
    },
  },
})