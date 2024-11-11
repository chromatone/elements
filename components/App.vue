<script setup>
import { ref, watch } from 'vue';
import { onKeyDown } from '@vueuse/core';

import ControlRotary from './ControlRotary.vue'
import ShowFFT from './ShowFFT.vue';
import ShowScope from './ShowScope.vue';

import { useSynth } from '../composables/useSynth';
import { pitchColor } from '../composables/calculations';
import { useMidi } from '../composables/useMidi';
import ControlAdsr from './ControlAdsr.vue';
import MidiKeys from './MidiKeys.vue';

const { play, stop, stopAll, started, controls, groups, voices } = useSynth()

const { inputs, midiLog, midiNote } = useMidi()

watch(midiNote, note => play(note.number, note.velocity))

onKeyDown('Escape', () => { stopAll() })

</script>

<template lang="pug">
.flex.flex-col.items-center.transition-all.duration-500.ease-out.select-none.rounded-8.shadow-xl.p-1.w-full.h-full.bg-444.text-white.gap-4
  //- MidiKeys
  .relative.-z-10
    .flex.flex-wrap.gap-2.items-center.absolute.top-0.w-full
      .p-1.flex-1.rounded-xl(v-for="voice in voices" :key="voice" :style="{ backgroundColor: pitchColor(voice.midi.value - 9, 3, undefined, voice.gate.value ? 1 : 0.1) }")
    ShowFFT
    ShowScope.absolute.top-0.pointer-events-none
  .flex.items-center
    button.text-2xl.p-4.cursor-pointer.border-2.rounded-2xl.z-1000( 
      @pointerdown="play(midiNote.number)" 
      @pointerup="stop(midiNote.number)" ) {{ started ? 'Press to play sound' : 'Start' }}
  .flex.flex-wrap.gap-2
    .relative.flex.flex-wrap.items-center.border-1.rounded-xl(
      style="flex: 1 1 100px"
      v-for="(group, g ) in groups" :key="group")
      .text-10px.absolute.-top-4.left-2.uppercase {{ g }}
      button.ml-1.p-2.border-light-400.rounded-xl.border-1(
        v-if="controls[g].hasOwnProperty(`on`)"
        :class="{ 'bg-dark-400': controls[g].on }"
        @click="controls[g].on == 0 ? controls[g].on = 1 : controls[g].on = 0")
        .i-la-check
      template(
        v-for="(control, c) in group"
        :key="c"
        )
        ControlRotary.w-4em(
          v-model="controls[g][c]" 
          v-bind="control"
          :param="c")
      ControlAdsr(
        v-if="['osc'].includes(g)"
        title="Amplitude Envelope"
        v-model:a="controls[g].attack"
        v-model:d="controls[g].decay"
        v-model:s="controls[g].sustain"
        v-model:r="controls[g].release"
        )
      ControlAdsr(
        v-if="['osc'].includes(g)"
          title="Filter Envelope"
          v-model:a="controls[g].fattack"
          v-model:d="controls[g].fdecay"
          v-model:s="controls[g].fsustain"
          v-model:r="controls[g].frelease"
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
</template>

<style lang="postcss">
#app {
  @apply w-full h-full p-1;
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
}
</style>
