<script setup>
import { ref, watch } from 'vue';
import { onKeyDown, useCycleList } from '@vueuse/core';

import ControlRotary from './components/ControlRotary.vue'
import ControlAdsr from './components/ControlAdsr.vue';
import ShowFFT from './components/ShowFFT.vue';
import ShowScope from './components/ShowScope.vue';

import { useSynth } from './composables/useSynth';
import { pitchColor } from './composables/calculations';
import { useMidi } from './composables/useMidi';

import { version, year } from './package.json'

import MidiKeys from './components/MidiKeys.vue';

const { play, stop, stopAll, started, controls, groups, voices, params } = useSynth()

const { inputs, midiLog, midiNote } = useMidi()

watch(midiNote, note => play(note.number, note.velocity))

onKeyDown('Escape', () => { stopAll() })

const layers = ['round', 'fat', 'string', 'noise', 'sampler']

const { next, state, go } = useCycleList(layers)

</script>

<template lang="pug">
.flex.flex-col.items-start.transition-all.duration-500.ease-out.select-none.rounded-8.shadow-xl.w-full.h-full.text-white.gap-2.flex-1
  .relative.z-10.w-full
    ShowFFT
    ShowScope.absolute.top-0.pointer-events-none
  .flex.flex-col.p-2
    .flex.items-center.gap-2.flex-wrap.w-full
      button.text-xl.p-4.cursor-pointer.border-2.rounded-2xl.bg-green-900.active-bg-green-200( 
        @pointerdown="play(midiNote.number)" 
        @pointerup="stop(midiNote.number)" ) {{ started ? 'PLAY' : 'START' }}

      .grid.gap-2.grid-cols-3
        .p-2.flex-1.rounded-xl(v-for="voice in voices" :key="voice" :style="{ backgroundColor: pitchColor(voice.midi.value - 9, 3, undefined, voice.gate.value ? 1 : 0.1) }")
      .flex.flex-wrap.items-center.border-1.rounded-xl
        ControlRotary(
          v-model="controls.synth.vol" 
          v-bind="params.synth.vol"
          param="VOL")
        ControlRotary(
          v-model="controls.synth.bpm" 
          v-bind="params.synth.bpm"
          param="BPM")

      .relative.flex.flex-wrap.items-center.border-1.rounded-xl(
        v-for="fx in ['pingpong', 'srvb']" :key="fx"
        style="flex: 0 1 350px"
        )
        button.ml-1.p-2.border-light-400.rounded-xl.border-1.uppercase.text-sm(
          v-if="controls[fx].hasOwnProperty(`on`)"
          :class="{ 'bg-dark-400': controls[fx].on }"
          @click="controls[fx].on == 0 ? controls[fx].on = 1 : controls[fx].on = 0") {{ fx }}
        template(
          v-for="(control, c) in groups[fx]"
          :key="c"
          )
          ControlRotary.w-4em.flex-1(
            v-model="controls[fx][c]" 
            v-bind="params[fx][c]"
            :param="c")


    .flex.flex-wrap.gap-2
      .uppercase.p-2.bg-dark-300.rounded-xl.border-1.border-black.border-op-20.flex.items-center.gap-2(
        v-for="layer in layers" :key="layer" 
        :class="{ 'bg-dark-800': state == layer, 'border-white border-op-90': state == layer }"
        @click="state = layer"
        ) 
        button.p-1.rounded-full.bg-dark-100.border-1(
          :class="{ 'border-white border-op-90': controls[layer].on }"
          :style="{ opacity: controls[layer].on ? 1 : 0.2 }"
          @click="controls[layer].on == 0 ? controls[layer].on = 1 : controls[layer].on = 0"
          )
          .i-la-power-off
        .p-0 {{ layer }}

    .flex.flex-wrap.gap-2
      .relative.flex.flex-wrap.items-center.border-1.rounded-xl
        template(
          v-for="(control, c) in groups[state]"
          :key="c"
          )
          ControlRotary.w-4em.flex-1(
            v-model="controls[state][c]" 
            v-bind="params[state][c]"
            :param="c")

        .flex.flex-wrap.flex-1
          ControlAdsr(
            v-if="controls[state].attack"
            title="Amplitude Envelope"
            v-model:a="controls[state].attack"
            v-model:d="controls[state].decay"
            v-model:s="controls[state].sustain"
            v-model:r="controls[state].release"
            )
          ControlAdsr(
            v-if="controls[state].fattack"
            title="Filter Envelope"
            v-model:a="controls[state].fattack"
            v-model:d="controls[state].fdecay"
            v-model:s="controls[state].fsustain"
            v-model:r="controls[state].frelease"
            )
  .flex-1
  MidiKeys

  .flex.flex-wrap.gap-2
    .p-2.rounded-md.bg-dark-300(v-for="(input, i) in inputs" :key="i") 
      .text-xs {{ input?.manufacturer }}
      .text-lg {{ input.name }}

  .bg-dark-300.p-2.flex.w-full.flex-col.gap-1.max-h-16.overflow-y-scroll
    .p-1.text-xs.flex.flex.items-center.gap-2(v-for="record in midiLog" :key="record") 
      .uppercase {{ record.message.type }}
      .i-la-cog(v-if="record.message.isSystemMessage")
      .op-80(v-if="record.message.isChannelMessage") CH{{ record.message.channel }}
      .op-80 {{ record.message.dataBytes[0] }}
      .op-80 {{ record.message.dataBytes[1] }}

.rounded-lg.bg-dark-800.bg-op-40.p-2.text-light-800.flex.gap-2.items-center.flex-wrap
  a.font-bold.no-underline.flex.items-center.gap-1(href="https://chromatone.center" target="_blank")
    img(src="/logo.svg" width="20" height="20")
    .p-0 Chromatone
  .p-0 Elements
  .flex-1
  span MIT {{ year }}
  a.flex.gap-1.items-center(href="https://github.com/chromatone/elements/" target="_blank")
    .i-la-github
    span v.{{ version }}

</template>

<style lang="postcss">
#app {
  @apply w-full flex flex-col min-h-100svh;
}

a {
  @apply underline;
}

html {
  @apply min-h-100svh;
}

body {
  @apply flex items-stretch justify-stretch min-h-100svh;
  background-color: #444;
  width: 100%;
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
  touch-action: pan-y;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
</style>
