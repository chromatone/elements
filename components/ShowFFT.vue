<script setup vapor>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { FFTs, meters } from '../composables/useSynth';
import { freqColor } from '../composables/calculations';

const props = defineProps({
  name: { default: 'main', type: String }
})

const canvas = ref(null);
let ctx = null;
let rafId = null;
let pendingDraw = false;

const sampleRate = ref(48000);

// LUTs - lookup tables for expensive calculations
let xLUT = [];           // Precomputed x positions
let barWidthLUT = [];    // Precomputed bar widths  
let freqLUT = [];        // Precomputed frequencies for color
let len = 0;             // Current FFT size

onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext('2d', { willReadFrequently: false });
  }
  draw();
});

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(afId);
});

watch(() => meters.sample_rate?.max, (val) => {
  if (val) sampleRate.value = val;
}, { immediate: true });

watch(() => FFTs?.[props.name], () => {
  if (!pendingDraw) {
    pendingDraw = true;
    rafId = requestAnimationFrame(() => {
      pendingDraw = false;
      draw();
    });
  }
}, { flush: 'post' });

function rebuildLUTs() {
  const data = FFTs?.[props.name];
  if (!data || !data[0]?.length) return;

  len = data[0].length;
  const { width } = canvas.value;
  const logLen = Math.log2(len + 1);
  const widthScale = width / logLen;
  const freqScale = sampleRate.value / len;

  xLUT = new Float32Array(len);
  barWidthLUT = new Float32Array(len);
  freqLUT = new Float32Array(len);

  for (let i = 0; i < len; i++) {
    xLUT[i] = Math.log2(i + 1) * widthScale;
    const nextX = Math.log2(i + 2) * widthScale;
    barWidthLUT[i] = nextX - xLUT[i];
    freqLUT[i] = i * freqScale;
  }
}

function draw() {
  if (!canvas.value || !ctx) return;

  const data = FFTs?.[props.name];
  if (!data || !data[0]?.length) return;

  // Rebuild LUTs if FFT size changed
  if (data[0].length !== len) {
    rebuildLUTs();
  }

  const { height } = canvas.value;
  const real = data[0];
  const imag = data[1];

  ctx.clearRect(0, 0, canvas.value.width, height);

  for (let i = 0; i < len; i++) {
    const value = Math.log2(1 + Math.abs(real[i]) + Math.abs(imag[i]));
    const barHeight = (value * value * height) / 50;
    ctx.fillStyle = freqColor(freqLUT[i], value);
    ctx.fillRect(xLUT[i], height - barHeight, barWidthLUT[i], barHeight);
  }
}
</script>

<template lang='pug'>
canvas.max-w-full.w-full(
  ref="canvas" 
  height="320"
  width="800"
  )
</template>
