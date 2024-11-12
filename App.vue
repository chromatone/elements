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

import { version } from './package.json'

// import MidiKeys from './components/MidiKeys.vue';

const { play, stop, stopAll, started, controls, groups, voices, params } = useSynth()

const { inputs, midiLog, midiNote } = useMidi()

watch(midiNote, note => play(note.number, note.velocity))

onKeyDown('Escape', () => { stopAll() })

const layers = ['fat', 'string', 'noise', 'sampler']

const { next, state, go } = useCycleList(layers)

</script>

<template lang="pug">
.flex.flex-col.items-center.transition-all.duration-500.ease-out.select-none.rounded-8.shadow-xl.p-1.w-full.h-full.bg-444.text-white.gap-4
  //- MidiKeys
  .relative.-z-10.h-50
    .flex.flex-wrap.gap-2.items-center.absolute.top-0.w-full
      .p-1.flex-1.rounded-xl(v-for="voice in voices" :key="voice" :style="{ backgroundColor: pitchColor(voice.midi.value - 9, 3, undefined, voice.gate.value ? 1 : 0.1) }")
    ShowFFT.h-40
    ShowScope.absolute.top-0.pointer-events-none

  .flex.items-center.gap-2.flex-wrap
    button.text-xl.p-4.cursor-pointer.border-2.rounded-2xl.bg-green-900.active-bg-green-200( 
      @pointerdown="play(midiNote.number)" 
      @pointerup="stop(midiNote.number)" ) {{ started ? 'PLAY' : 'START' }}
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
      style="flex: 1 1 300px"
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
    button.uppercase.p-2.bg-dark-300.rounded-xl.border-1.border-black.border-op-20(
      v-for="layer in layers" :key="layer" 
      :class="{ 'bg-dark-800': state == layer, 'border-white border-op-90': controls[layer].on }"
      @click="state = layer"
      ) {{ layer }}

  .flex.flex-wrap.gap-2
    .relative.flex.flex-wrap.items-center.border-1.rounded-xl
      button.ml-1.p-2.border-light-400.rounded-xl.border-1.uppercase.text-sm(
        v-if="controls[state].hasOwnProperty(`on`)"
        :class="{ 'bg-dark-400': controls[state].on }"
        @click="controls[state].on == 0 ? controls[state].on = 1 : controls[state].on = 0") {{ state }}

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




  .flex.flex-wrap.p-4 
    .p-2.rounded-xl.bg-dark-300(v-for="(input, i) in inputs" :key="i") 
      .text-xs {{ input?.manufacturer }}
      .text-xl {{ input.name }}
  .flex-1
  .bg-dark-300.p-2.flex.w-full.flex-col.max-h-20.gap-1 
    .p-1.text-xs.flex.flex.items-center.gap-2(v-for="record in midiLog" :key="record") 
      .uppercase {{ record.message.type }}
      .i-la-cog(v-if="record.message.isSystemMessage")
      .op-80(v-if="record.message.isChannelMessage") CH{{ record.message.channel }}
      .op-80 {{ record.message.dataBytes[0] }}
      .op-80 {{ record.message.dataBytes[1] }}
.bg-dark-800.bg-op-40.p-1 v.{{ version }}
</template>

<style lang="postcss">
#app {
  @apply w-full h-full p-2;
}

a {
  @apply underline;
}

body {
  @apply flex items-stretch justify-stretch;
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
  touch-action: pan-y;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
</style>
