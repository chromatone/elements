<script setup vapor>
import { ref, onMounted, onUnmounted, watch } from 'vue';
// FIX: import version counter + plain data object instead of reactive FFTs
import { FFTs, meters, fftVersion } from '../composables/useSynth';
import { freqColor } from '../composables/calculations';

const props = defineProps({
  name: { default: 'main', type: String }
})

const canvas = ref(null);
let ctx = null;
let rafId = null;
let pendingDraw = false;

const sampleRate = ref(48000);

let xLUT = [];
let barWidthLUT = [];
let freqLUT = [];
let len = 0;

onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext('2d', { willReadFrequently: false });
  }
  draw();
});

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId);
});

watch(() => meters.sample_rate?.max, (val) => {
  if (val) sampleRate.value = val;
}, { immediate: true });

// FIX: watch the version counter instead of the reactive array
// FFTs[name] is now a plain array of Float32Array — no Proxy overhead
watch(fftVersion, () => {
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

  // FIX: FFTs[name] is now [Float32Array, Float32Array] — direct typed array access
  const data = FFTs?.[props.name];
  if (!data || !data[0]?.length) return;

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