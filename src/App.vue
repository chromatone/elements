<script setup>
import { ref } from 'vue';
import ControlRotary from './ControlRotary.vue'
import ElemFFT from './ElemFFT.vue';
import ElemScope from './ElemScope.vue';
import { useSynth } from './useSynth';
import { pitchColor } from './calculations';
import { onKeyDown } from '@vueuse/core';

const { play, stop, stopAll, started, controls, groups, voices, } = useSynth()

const midi = ref(57)

onKeyDown('Escape', () => { stopAll() })
</script>

<template lang="pug">
.flex.flex-col.items-center.transition-all.duration-500.ease-out.select-none.rounded-8.shadow-xl.p-1.w-full.h-full.bg-444.text-white.gap-4
  ElemScope()
  .flex-1 
  .relative.flex.flex-wrap.gap-2.border-1.rounded-xl(v-for="(group, g ) in groups" :key="group")
    .text-10px.absolute.-top-4.left-2.uppercase {{ g }}
    control-rotary.w-4em(
      v-for="(control, c) in group"
      :key="c"
      v-model="controls[`${g}_${c}`]" 
      v-bind="control"
      :param="c")
  .flex.items-center
    ControlRotary(v-model="midi" :min="10" :max="120" :step="1" param="MIDI")
    button.text-2xl.p-4.cursor-pointer.border-2.rounded-2xl( 
      @pointerdown="play(midi)" 
      @pointerup="stop(midi)" ) {{ started ? 'Press to play sound' : 'Start' }}
  .flex.flex-wrap.gap-2.items-center
    .p-2.flex-1.rounded-xl(v-for="voice in voices" :key="voice" :style="{ backgroundColor: pitchColor(voice.midi.value - 9, 3, undefined, voice.gate.value ? 1 : 0.1) }")
  .flex-1
  ElemFFT
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
