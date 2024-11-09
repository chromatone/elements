<script setup>
import { reactive, ref } from 'vue'

import ControlRotary from './ControlRotary.vue'
import { useSynth } from './useSynth';


const notes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#']

const n = ref(0)


const { play, stop, started } = useSynth()


</script>

<template lang="pug">
.flex.flex-col.items-stretch.transition-all.duration-500.ease-out.select-none.rounded-8.shadow-xl.p-1.w-full.h-full.bg-444.text-white
  button.text-2xl.p-4.cursor-pointer( 
    @pointerdown="play()" 
    @pointerup="stop()" 
    @pointerleave="stop()") {{ started ? 'Press to play sound' : 'Start' }}
  .p-3 {{ n }}
  control-rotary.w-4em(
    v-model="n" 
    :min="0" 
    :max="1000" 
    :step="0.05" 
    :fixed="0" 
    param="N")


</template>

<style lang="postcss">
#app {
  @apply w-full h-full p-1;
}

a {
  @apply underline;
}

body {
  @apply flex items-stretch justify-stretch h-100svh;
  background-color: #444;
  width: 100%;
  min-width: 320px;
  min-height: 100vh;
  line-height: 1.3;
  font-family: "Commissioner", -apple-system, BlinkMacSystemFont, "Segoe UI",
    Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans",
    "Helvetica Neue", sans-serif;
  font-size: 1em;
  font-weight: 400;
  color: var(--c-text);
  direction: ltr;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overscroll-behavior: none;
  overflow: hidden;
}
</style>
