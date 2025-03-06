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

const layers = ['round', 'fat', 'string', 'noise']

const fxs = ['pingpong', 'srvb']

const { state: fxState } = useCycleList(fxs)

const { next, state, go } = useCycleList(layers)


const info = ref(true)

</script>

<template lang="pug">
.flex.flex-col.items-start.transition-all.duration-500.ease-out.select-none.rounded-8.shadow-xl.w-full.h-full.flex-1.text-white

  article.cursor-pointer.rounded-xl.z-1000.fixed.top-4.left-4.right-4.bottom-4.p-8.flex.flex-col.gap-6.bg-dark-800.bg-op-80.backdrop-blur.overflow-y-scroll.overscroll-none(v-show="info" @pointerdown="play(midiNote.number)"  @pointerup="stop(midiNote.number); info = false" )
    a.font-bold.no-underline.flex.items-center.gap-1(href="https://chromatone.center" target="_blank")
      img(src="/logo.svg" width="30" height="30")
      h1.text-xl Chromatone
    h2.text-4xl Elements
    h2.text-2xl Multilayered polyphonic synthesizer app 
    h3.max-w-55ch Explore unique sounds of 6 voice polyphony, 4 layers of sound generators for each of them and 2 global effects with any MIDI controller, laptop keyboard and flexible onscreen keyboard with choice of scales while analyzing the output on the global oscilloscope and colorized FFT time-frequency bars. Notes and frequencies are set according to Chromatone.  
    .text-xl.font-bold.py-2 Install this web-app for offline use!
    p.max-w-55ch This Progressive Web-Application can be installed and used just like a regular app on your mobile or desktop platform.
    .flex.flex-col.gap-4.max-w-55ch
      .p-0
        i.i-la-apple.inline-block.text-lg
        | <b>iOS</b>: Open this page in Safari, tap the 
        i.i-ic-round-ios-share.inline-block
        |   "Share" button, then select 
        i.i-material-symbols-add-box-outline-rounded.inline-block
        |   "Add to Home Screen" action down in the list.
      .p-0 
        i.i-la-android.inline-block.text-lg
        | <b>Android</b>: Open this page in Chrome, tap the menu button 
        i.i-la-ellipsis-v.inline-block
        |  (three dots), then select "Add to Home Screen".
      .p-0 
        i.i-la-apple.inline-block.text-lg
        |  <b>macOS</b>: Open this page in Safari, click the 
        i.i-ic-round-ios-share.inline-block
        |  "Share" button, then select 
        i.i-f7-rectangle-dock.inline-block
        |  "Add to Dock" action in the list.
      .p-0  
        i.i-la-windows.inline-block.text-lg
        | <b>Windows</b>: Open this page in Edge, click the "Settings and more" button 
        i.i-la-ellipsis-h.inline-block
        |  (three dots), then select "Apps" > "Install this site as an app".
    .flex-1
    .flex.flex-wrap.items-center.gap-2
      a.font-bold.no-underline.flex.items-center.gap-1(href="https://chromatone.center" target="_blank")
        img(src="/logo.svg" width="20" height="20")
        h1.p-0 Chromatone
      h2.p-0 Elements
      .flex-1

      a.flex.gap-1.items-center.no-underline(href="https://github.com/chromatone/elements/" target="_blank")
        .i-la-github
        span v.{{ version }}
  //- span MIT {{ year }}


.flex.flex-col.p-2.pb-12.pt-4.gap-2.text-white
  .flex.items-center.gap-2.flex-wrap.w-full
    button.rounded-full.text-2xl(@click="info = true")
      .i-la-info-circle
    button.active-brightness-120.transition.hover-op-100.op-80.border-2.text-xl.p-4.cursor-pointer.rounded-full.active-bg-green-200( 
      :style="{ backgroundColor: pitchColor(midiNote.number + 3) }"
      @pointerdown="play(midiNote.number)" 
      @pointerup="stop(midiNote.number)" )

    .gap-2.columns-2
      .p-2.flex-1.rounded-xl(v-for="voice in voices" :key="voice" :style="{ backgroundColor: pitchColor(voice.midi.value - 9, undefined, undefined, voice.gate.value ? 1 : 0.1) }")
    .flex.flex-wrap.items-center.border-1.rounded-xl
      ControlRotary(
        v-model="controls.synth.vol" 
        v-bind="params.synth.vol"
        param="VOL")
      ControlRotary(
        v-model="controls.synth.bpm" 
        v-bind="params.synth.bpm"
        param="BPM")

    .flex.flex-wrap.gap-2.flex-1
      a.cursor-pointer.no-underline.uppercase.p-2.bg-dark-300.rounded-xl.border-1.border-black.border-op-20.flex.items-center.gap-2.text-sm.flex-1.transition(
        v-for="layer in layers" :key="layer" 
        :class="{ 'bg-dark-800': controls[layer].on, 'border-white border-op-90': state == layer }"
        @click="state = layer"
        ) 
        button.p-1.rounded-full.bg-dark-100.border-1(
          :class="{ 'border-white border-op-90': controls[layer].on }"
          :style="{ opacity: controls[layer].on ? 1 : 0.2 }"
          @click.prevent.stop="controls[layer].on == 0 ? controls[layer].on = 1 : controls[layer].on = 0"
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

    .flex.flex-wrap.gap-2.flex-1
      a.no-underline.uppercase.p-2.bg-dark-300.rounded-xl.border-1.border-black.border-op-20.flex.items-center.gap-2(
        v-for="fx in fxs" :key="fx" 
        :class="{ 'bg-dark-800': fxState == fx, 'border-white border-op-90': fxState == fx }"
        @click="fxState = fx"
        ) 
        button.p-1.rounded-full.bg-dark-100.border-1(
          :class="{ 'border-white border-op-90': controls[fx].on }"
          :style="{ opacity: controls[fx].on ? 1 : 0.2 }"
          @click="controls[fx].on == 0 ? controls[fx].on = 1 : controls[fx].on = 0"
          )
          .i-la-power-off
        .p-0 {{ fx }}


    .relative.flex.flex-wrap.items-center.border-1.rounded-xl(
      v-for="fx in [fxState]" :key="fx"
      style="flex: 0 1 350px"
      )
      template(
        v-for="(control, c) in groups[fx]"
        :key="c"
        )
        ControlRotary.w-4em.flex-1(
          v-model="controls[fx][c]" 
          v-bind="params[fx][c]"
          :param="c")

.flex-1


MidiKeys

.sticky.top-0.rounded-lg.w-full.z-100.shadow-lg
  .relative.z-10.w-full.bg-dark-800.bg-op-50.backdrop-blur(  @pointerdown="play(midiNote.number)" @pointerup="stop(midiNote.number)") 
    ShowFFT.max-h-30vh
    ShowScope.absolute.top-0.pointer-events-none



.flex.flex-wrap.gap-2(v-if="inputs.length")
  .p-2.rounded-md.bg-dark-300(v-for="(input, i) in inputs" :key="i") 
    .text-xs {{ input?.manufacturer }}
    .text-lg {{ input.name }}

.bg-dark-300.p-2.flex.w-full.flex-col.gap-1.max-h-16.overflow-y-scroll(v-if="midiLog.length")
  .p-1.text-xs.flex.flex.items-center.gap-2(v-for="record in midiLog" :key="record") 
    .uppercase {{ record.message.type }}
    .i-la-cog(v-if="record.message.isSystemMessage")
    .op-80(v-if="record.message.isChannelMessage") CH{{ record.message.channel }}
    .op-80 {{ record.message.dataBytes[0] }}
    .op-80 {{ record.message.dataBytes[1] }}



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

html,
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
