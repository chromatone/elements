import WebRenderer from '@elemaudio/web-renderer'
import { el } from '@elemaudio/core'
import { useClamp } from '@vueuse/math';

import { ref, reactive } from "vue";
import { useParams } from './useParams';
import { srvb } from '../elements/srvb'
import { useVoices } from './useVoices';

import { createSubtractive, params } from '../elements/'
import noteKeys from './noteKeys.json'
import { pingPong } from '../elements/pingpong';

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

    const signal = el.tanh(el.mul(cv.synth_vol, el.add(...voices.map((_, i) => el.add(
      createSubtractive(getVoiceParams(i), cv)
    )
    ))))

    const sampleRate = el.mul(0, el.meter({ name: 'sample-rate' }, el.sr()))

    const analyzed = el.fft({ name: 'main', size: 2048 }, el.scope({ name: 'main', size: 512 }, el.add(sampleRate, signal)))

    const ping = pingPong([analyzed, analyzed], cv)

    const stereo = srvb({
      key: 'srvb',
      sampleRate: 48000,
      size: cv.reverb_size,
      decay: cv.reverb_decay,
      mod: cv.reverb_mod,
      mix: el.mul(cv.reverb_mix, cv.reverb_on),
    }, ...ping)

    core.render(...stereo)

    initiated.value = true
    started.value = true
  }

  function play(midi = 57, vel = 1) {
    if (!started.value) { start() }
    cycleNote(midi, vel)
  }

  function stop(midi = 57) { cycleNote(midi, 0) }


  const keyOffset = useClamp(2, 0, 4)

  document.addEventListener('keydown', e => {
    if (e.code == 'Digit1') keyOffset.value--
    if (e.code == 'Equal') keyOffset.value++
    if (e.repeat || !noteKeys[e.code]) return
    if (e.ctrlKey || e.altKey || e.metaKey) return
    if (e.code == 'Slash') e.preventDefault()
    play(noteKeys[e.code] + keyOffset.value * 12, 1)
  })

  document.addEventListener('keyup', e => {
    if (!noteKeys[e.code]) return
    stop(noteKeys[e.code] + keyOffset.value * 12)
  })

  return { controls, keyOffset, groups, play, stop, stopAll, initiated, started, meters, scopes, FFTs, voices }
}
