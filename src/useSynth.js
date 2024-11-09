import WebRenderer from '@elemaudio/web-renderer'
import { el } from '@elemaudio/core'

import { ref, reactive } from "vue";
import { useParams } from './useParams';
import { useVoices } from './useVoices';
import { srvb } from './srvb'

const params = {
  "synth_trigger": { "value": 0, "min": 0, "max": 1, "step": 0.01, "nostore": true },
  "synth_midi": { "value": 57, "min": 0, "max": 127, "step": 0.01 },
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

  const { voices, cycleNote, initVoices, getVoiceParams } = useVoices()

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

    const sampleRate = el.mul(0, el.meter({ name: 'sample-rate' }, el.sr()))

    const sound = el.mul(
      cv.synth_trigger,
      el.cycle(midiFrequency(cv.synth_midi)))

    const signal = el.fft({ name: 'synth', size: 2048 }, el.scope({ name: 'synth', size: 512 }, el.add(sampleRate, sound)))

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

  function play() {
    if (!started.value) { start() }
    controls.synth_trigger = 1
  }

  function stop() { controls.synth_trigger = 0 }

  return { controls, groups, play, stop, initiated, started, meters, scopes, FFTs, voices, cycleNote }
}



export const midiFrequency = x => el.mul(440, el.pow(2, el.smooth(el.tau2pole(0.001), el.div(el.sub(x, 69), 12))))


