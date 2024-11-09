import WebRenderer from '@elemaudio/web-renderer'
import { el, } from '@elemaudio/core'
import { ref } from 'vue'

const initiated = ref(false)
const started = ref(false)

let ctx, core

let setTrig

export function useSynth() {
  return { play, stop, initiated, started }
}

async function initAudio() {
  if (initiated.value) return
  ctx = new (window.AudioContext || window.webkitAudioContext)()
  core = new WebRenderer()
  const node = await core.initialize(ctx, {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [2],
  })
  node.connect(ctx.destination)
  initiated.value = true
}

async function render() {
  if (!initiated.value) await initAudio()
  if (ctx.state === 'suspended') await ctx.resume()

  const [trigger, setTrigger] = core.createRef('const', { value: 0 }, [])
  setTrig = setTrigger


  const signal = el.mul(
    el.smooth(
      el.tau2pole(0.01),
      trigger),
    el.cycle(220))

  core.render(signal, signal)
  started.value = true
}

function play() {
  if (!started.value) { render() }
  setTrig?.({ value: .8 })
}

function stop() { setTrig?.({ value: 0 }) }

