<script setup>

import { computed, ref, watch } from 'vue';
import { useGesture } from '@vueuse/gesture';
import { useClamp } from '@vueuse/math'
import { useStorage } from '@vueuse/core'
import { ScaleType } from 'tonal'

import { useMidi } from '../composables/useMidi.js'
import { notes, pitchColor } from '../composables/calculations.js';

import { useRange } from '../composables/useRange.js'
import { globalScale } from '../composables/useScale.js';
import MidiKeysNote from './MidiKeysNote.vue';


const props = defineProps({
  width: { type: Number, default: 1100 },
  height: { type: Number, default: 340 },
  controlOffset: { type: Number, default: 100 },
  slotOffset: { type: Number, default: 100 }
})


const { activeNotes } = useMidi()

const { roundBegin: begin, roundEnd: end, beginControl, endControl, range } = useRange()

const svg = ref()
const area = ref()

const pressed = ref(false)

const tonicControl = ref()
const tonicCents = ref(globalScale.tonic * 100)

watch(tonicCents, cents => {
  globalScale.tonic = Math.round(((cents / 100) % 12 + 12) % 12)
})

useGesture({
  onDrag(ev) {
    ev.event.preventDefault()
    tonicCents.value += ev.delta[0] - ev.delta[1]
  },
  onWheel(ev) {
    ev.event.preventDefault()
    tonicCents.value -= ev.velocities[0] + ev.velocities[1] * 4
  }
}, {
  domTarget: tonicControl,
  eventOptions: { passive: false }
})

const scaleControl = ref()
const scaleCurrent = useClamp(useStorage('midikeys-scale', 1), 1, ScaleType.all().length - 1)

useGesture({
  onDrag(ev) {
    ev.event.preventDefault()
    scaleCurrent.value += ev.delta[0] / 5 - ev.delta[1] / 5
  },
  onWheel(ev) {
    ev.event.preventDefault()
    scaleCurrent.value -= ev.velocities[0] / 5 - ev.velocities[1] / 5
  }
}, {
  domTarget: scaleControl,
  eventOptions: { passive: false }
})

const scaleChroma = computed(() => {
  let num = Math.round(scaleCurrent.value)
  return ScaleType.all()[num]
})

watch(scaleChroma, scale => {
  globalScale.chroma = scale.chroma
})

const filterScale = useStorage('filter-keys', true)

const keys = computed(() => filterScale.value ? range.value.filter(key => {
  return globalScale.isIn(notes[(key + 3) % 12])
}) : range.value)

</script>

<template lang='pug'>
svg.cursor-pointer.select-none.touch-none.shadow-xl.mx-auto(
  :viewBox="`0 -${slotOffset} ${width} ${height + controlOffset}`"
  version="1.1",
  baseProfile="full",
  xmlns="http://www.w3.org/2000/svg",
  style="touch-action:none"
  ref="svg"
  @pointerdown="pressed = true"
  @pointercancel="pressed = false"
  @pointerup="pressed = false"
  @pointerleave="pressed = false"
  )
  g.slot(
    :transform="`translate(0,${-slotOffset - controlOffset})`"
    )
    slot
  g.offset.cursor-grab.active-cursor-grabbing(  
    :transform="`translate(0,${-controlOffset})`"
    )
    g.tonic(
      ref="tonicControl"
      )
      rect(
        :height="controlOffset"
        :width="width / 5"
        :fill="pitchColor(globalScale.tonic, 3, .8)"
        )
      text.font-bold.text-5xl(
        :x="width / 10"
        text-anchor="middle"
        :y="controlOffset * .75"
        ) {{ notes[(globalScale.tonic) % 12] }}
      line(
        v-for="(note, n) in notes"
        :transform="`translate(${(n / 12 + 1 / 24) * width / 5},0)`"
        :y2="16"
        stroke-width="6"
        stroke-linecap="round"
        :stroke="pitchColor(n, 5, .4)"
        )
      line(
        :y2="20"
        stroke-width="8"
        stroke-linecap="round"
        :transform="`translate(${(((tonicCents / 1200) % 1 + 1) % 1) * width / 5 + width / 120},0)`"
        stroke="white"
        )
    g.scale(
      ref="scaleControl"
      :transform="`translate(${width / 5},0)`"
      )
      rect(
        :width="width * 2 / 5"
        :height="controlOffset"
        fill="#aaa"
        )
      text.text-4xl(
        :x="50"
        :y="controlOffset * .75"
        ) {{ scaleChroma.name }}
      line(
        v-for="(note, n) in ScaleType.all().length"
        :transform="`translate(${(n / ScaleType.all().length + 1 / (ScaleType.all().length)) * width * 2 / 5},0)`"
        :y2="36"
        :opacity="note == Math.round(scaleCurrent) ? 1 : .2"
        stroke-width="2"
        stroke-linecap="round"
        :stroke="`currentColor`"
        )
      line(
        :y2="20"
        stroke-width="8"
        stroke-linecap="round"
        :transform="`translate(${scaleCurrent / ScaleType.all().length * width * 2 / 5},0)`"
        stroke="white"
        )

      g.show(
        :transform="`translate(30,15)`"
        )
        circle(
          @click="filterScale = !filterScale"
          :cy="controlOffset * .5"
          r="10"
          :fill="filterScale ? 'black' : 'transparent'"
          :stroke="'black'"
          :stroke-width="4"
          )


    g.begin(
      ref="beginControl"
      :transform="`translate(${width * 3 / 5},0)`"
      )
      rect(
        :height="controlOffset"
        :width="width / 5"
        :fill="pitchColor(begin + 3, undefined, activeNotes[begin] ? 1 : 0.1)"
        )
      text.font-bold.text-5xl.pointer-events-none(
        :x="10"
        :y="controlOffset * .75"
        ) {{ notes[(begin + 3) % 12] }}{{ Math.floor((Math.round(begin) + 3) / 12) - 1 }}

    g.end(
      ref="endControl"
      :transform="`translate(${width * 4 / 5},0)`"
      )
      rect(
        :height="controlOffset"
        :width="width / 5"
        :fill="pitchColor(end + 3, undefined, activeNotes[end] ? 1 : 0.1)"
        )
      text.font-bold.text-5xl.pointer-events-none(
        :x="width / 5 - 20"
        text-anchor="end"
        :y="controlOffset * .75"
        ) {{ notes[(end + 3) % 12] }}{{ Math.floor((end + 3) / 12) - 1 }}


    g.range.pointer-events-none(
      :transform="`translate(${width * 3 / 5},0)`"
      )
      line(
        v-for="(note, n) in 127"
        :transform="`translate(${(n / 127) * width * 2 / 5},0)`"
        :y2="16"
        opacity=".3"
        stroke-width="2"
        stroke-linecap="round"
        :stroke="(n + 3) % 12 == globalScale.tonic ? pitchColor((n + 3) % 12) : `white`"
        )
      rect.ranger(
        :x="(begin / 127) * width * 2 / 5"
        :width="((end - begin) / 127) * width * 2 / 5"
        height="20"
        fill="gray"
        :opacity=".8"
        )
      line.begin(
        :y2="20"
        stroke-width="8"
        stroke-linecap="round"
        :transform="`translate(${(begin / 127) * width * 2 / 5},0)`"
        stroke="white"
        )
      line.end(
        :y2="20"
        stroke-width="8"
        stroke-linecap="round"
        stroke="white"
        :transform="`translate(${(end / 127) * width * 2 / 5},0)`"
        )

  g.keys(
    ref="area"
    )
    rect(:width :height fill="#333")
    MidiKeysNote(
      v-for="(key, k) in keys" :key="key"
      :note="key"
      :step="k"
      :width="width / keys.length"
      :height="height"
      :pressed="pressed"
      )
</template>

<style scoped>
svg {
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -o-user-select: none;
  user-zoom: none;
  -webkit-user-drag: none;
  -webkit-touch-callout: none;
  -webkit-user-callout: none;
  -webkit-user-select: none;
  -webkit-user-modify: none;
  -webkit-highlight: none;
}
</style>