<script setup vapor>
import { ref, onMounted, onUnmounted, watch } from 'vue';
// FIX: import version counter + plain data object instead of reactive scopes
import { scopes, scopeVersion } from '../composables/useSynth';

const props = defineProps({
  name: { default: 'main', type: String },
  color: { default: 'white', type: String },
  triggerLevel: { default: 0, type: Number },
})

const canvas = ref(null);
let ctx = null;
let animationFrameId = null;
let currentStrokeStyle = props.color;
let pendingDraw = false;

onMounted(() => {
  if (canvas.value) {
    canvas.value.width = canvas.value.clientWidth
    canvas.value.height = canvas.value.clientHeight
    ctx = canvas.value.getContext('2d', { willReadFrequently: false });
    ctx.strokeStyle = currentStrokeStyle;
    ctx.lineWidth = 3;
  }
});

onUnmounted(() => {
  stopAnimation();
});

// FIX: only redraw when scope data actually changes — no more continuous 60fps loop
watch(scopeVersion, () => {
  if (!pendingDraw) {
    pendingDraw = true;
    animationFrameId = requestAnimationFrame(() => {
      pendingDraw = false;
      draw();
    });
  }
});

function stopAnimation() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function findTriggerIndex(data, triggerLevel) {
  for (let i = 0; i < data.length - 1; i++) {
    if (data[i] <= triggerLevel && data[i + 1] > triggerLevel) {
      return i;
    }
  }
  return 0;
}

function draw() {
  if (!canvas.value || !ctx) return
  const { width, height } = canvas.value;
  // FIX: scopes[name] is now a Float32Array (direct reference, no copy)
  const samples = scopes[props.name];
  if (!samples || samples.length < 2) return;

  if (currentStrokeStyle !== props.color) {
    currentStrokeStyle = props.color;
    ctx.strokeStyle = currentStrokeStyle;
  }
  ctx.clearRect(0, 0, width, height);

  const triggerIndex = findTriggerIndex(samples, props.triggerLevel);
  const step = width / samples.length;

  ctx.beginPath();
  for (let i = 0; i < samples.length; i++) {
    const x = i * step;
    const sampleIndex = (triggerIndex + i) % samples.length;
    const y = (1 - samples[sampleIndex]) * height / 2;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  // FIX: no more requestAnimationFrame(draw) — we only draw on data change
}
</script>

<template lang="pug">
canvas.w-full.h-full(ref="canvas")
</template>