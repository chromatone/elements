import WebRenderer from '@elemaudio/web-renderer'
import { el } from '@elemaudio/core'

import { ref, reactive } from "vue";
import { useParams } from './useParams';
import { srvb } from './srvb'
import { useVoices } from './useVoices';
import { useVoice } from './useVoice';

const params = {
  "synth_vol": { "value": 0.5, "min": 0, "max": 1, "step": 0.01 },

  "reverb_on": { "value": 1, "min": 0, "max": 1, "step": 1, "hidden": true },
  "reverb_size": { "value": 0.2, "min": 0, "max": 1, "step": 0.01 },
  "reverb_decay": { "value": 0.5, "min": 0, "max": 1, "step": 0.01 },
  "reverb_mod": { "value": 0.5, "min": 0, "max": 1, "step": 0.01 },
  "reverb_mix": { "value": 0.5, "min": 0, "max": 1, "step": 0.01 }
}

export const meters = reactive({})
export const scopes = reactive({})
export const FFTs = reactive({})

export function useSynth() {

  const initiated = ref(false)
  const started = ref(false)

  let ctx, core

  const { controls, cv, groups, initRefs } = useParams(params, 'el')

  const { voices, cycleNote, initVoices, getVoiceParams, stopAll } = useVoices()

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
    initVoices(core)

    core.on('meter', (e) => meters[e.source] = { max: e.max, min: e.min })
    core.on('scope', (e) => scopes[e.source] = Array.from(e?.data[0].values()))
    core.on('fft', (e) => FFTs[e.source] = [Array.from(e?.data.real.values()), Array.from(e?.data.imag.values())])
    core.on('error', err => console.log(err))

    const sound = el.tanh(el.add(...voices.map((_, i) => useVoice(getVoiceParams(i), cv))))

    const sampleRate = el.mul(0, el.meter({ name: 'sample-rate' }, el.sr()))

    const signal = el.fft({ name: 'main', size: 2048 }, el.scope({ name: 'main', size: 512 }, el.add(sampleRate, sound)))

    const stereo = srvb({
      key: 'srvb',
      sampleRate: 48000,
      size: cv.reverb_size,
      decay: cv.reverb_decay,
      mod: cv.reverb_mod,
      mix: el.mul(cv.reverb_mix, cv.reverb_on),
    }, signal, signal)

    core.render(...stereo)

    initiated.value = true
    started.value = true
  }

  function play(midi = 57, vel = 1) {
    if (!started.value) { start() }
    cycleNote(midi, vel)
  }

  function stop(midi = 57) { cycleNote(midi, 0) }

  return { controls, groups, play, stop, stopAll, initiated, started, meters, scopes, FFTs, voices }
}




