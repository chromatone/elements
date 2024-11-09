import WebRenderer from '@elemaudio/web-renderer'

import { ref, reactive } from "vue";
import { useParams } from './useParams';
import { useSignal, params } from './useSignal';

export const meters = reactive({})
export const scopes = reactive({})
export const FFTs = reactive({})

export function useSynth() {

  const initiated = ref(false)
  const started = ref(false)

  let ctx, core

  const { controls, cv, groups, initRefs } = useParams(params, 'el')

  async function start() {

    if (initiated.value) return
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') await ctx.resume()
    core = new WebRenderer()
    const node = await core.initialize(ctx, {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    })
    node.connect(ctx.destination)
    initRefs(core)

    core.on('meter', (e) => meters[e.source] = { max: e.max, min: e.min })
    core.on('scope', (e) => scopes[e.source] = Array.from(e?.data[0].values()))
    core.on('fft', (e) => FFTs[e.source] = [Array.from(e?.data.real.values()), Array.from(e?.data.imag.values())])
    core.on('error', err => console.log(err))

    const stereo = useSignal(cv)
    core.render(...stereo)

    initiated.value = true
    started.value = true
  }


  function play() {
    if (!started.value) { start() }
    controls.synth_trigger = 1
  }

  function stop() { controls.synth_trigger = 0 }

  return { controls, groups, play, stop, initiated, started, meters, scopes, FFTs }
}







