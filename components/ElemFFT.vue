<script setup>
import { ref, onMounted, watch, reactive, computed } from 'vue';
import { FFTs, meters } from '../composables/useSynth';
import { freqColor } from '../composables/calculations';

const props = defineProps({
  name: { default: 'main', type: String }
})

const FFT = reactive({
  sr: computed(() => meters['sample-rate']?.max || 44100),
  data: computed(() => FFTs?.[props.name] || [[], []]),
  freq: computed(() => FFT.data[0].map((val, v) => v * FFT.sr / (FFT.data[0].length || 1))),
  colors: computed(() => FFT.freq.map(f => freqColor(f))),
  total: computed(() => FFT.data[0].map((val, v) => Math.log2(1 + Math.abs(val) + Math.abs(FFT.data[1][v])))),
})

let canvas = ref(null);

onMounted(draw);
watch(() => FFTs?.[props.name], draw, { deep: true });

function draw() {

  if (!canvas.value || !FFT?.total) return;

  let context = canvas.value.getContext('2d');
  context.clearRect(0, 0, canvas.value.width, canvas.value.height);

  for (let i = 0; i < FFT.total.length; i++) {
    let value = FFT.total[i];
    let barHeight = Math.pow(value, 2) * canvas.value.height / 50;
    let x = Math.log2(i + 1) * canvas.value.width / Math.log2(FFT.total.length + 1);
    let nextX = Math.log2(i + 2) * canvas.value.width / Math.log2(FFT.total.length + 1);
    let barWidth = nextX - x;
    let y = canvas.value.height - barHeight;
    context.fillStyle = FFT.colors[i];
    context.fillRect(x, y, barWidth, barHeight);
  }

}
</script>

<template lang='pug'>
canvas.max-w-full(
  ref="canvas" 
  height="512"
  width="2048")
</template>
