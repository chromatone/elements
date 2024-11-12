import WebRenderer from '@elemaudio/web-renderer'
import { el } from '@elemaudio/core'
import { useClamp } from '@vueuse/math';
import { ref, reactive } from "vue";

import { useParams } from './useParams';
import { useVoices } from './useVoices';
import noteKeys from './noteKeys.json'

import { params } from '../elements/'

import { pingPong } from '../elements/fx/pingpong';
import { srvb } from '../elements/fx/srvb'
import { useMidi } from './useMidi';

import { createNoise } from '../elements/noise';
import { createFat } from '../elements/fat';
import { createString } from '../elements/string';
import { createSampler } from '../elements/sampler';
import { createRound } from '../elements/round';


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
    initiated.value = true
    started.value = true

    ctx = new (window.AudioContext || window.webkitAudioContext)()


    core = new WebRenderer()

    const node = await core.initialize(ctx, {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    })
    node.connect(ctx.destination)

    initRefs(core)
    initVoices(core)


    let res = await fetch('/A4.mp3')
    let sampleBuffer = await ctx.decodeAudioData(await res.arrayBuffer())
    core.updateVirtualFileSystem({
      'piano': sampleBuffer.getChannelData(0),
    })



    core.on('meter', (e) => meters[e.source] = { max: e.max, min: e.min })
    core.on('scope', (e) => scopes[e.source] = Array.from(e?.data[0].values()))
    core.on('fft', (e) => FFTs[e.source] = [Array.from(e?.data.real.values()), Array.from(e?.data.imag.values())])
    core.on('error', err => console.log(err))

    const signal = el.tanh(el.mul(cv.synth.vol, el.add(...voices.map((_, i) => {
      const voiceParams = getVoiceParams(i)
      return el.add(
        createRound(voiceParams, cv.round, cv.synth.bpm),
        createFat(voiceParams, cv.fat, cv.synth.bpm),
        createNoise(voiceParams, cv.noise, cv.synth.bpm),
        createString(voiceParams, cv.string, cv.synth.bpm),
        createSampler(voiceParams, cv.sampler, cv.synth.bpm)
      )
    }
    ))))

    const sampleRate = el.mul(0, el.meter({ name: 'sample_rate' }, el.sr()))

    const analyzed = el.fft({ name: 'main', size: 2048 }, el.scope({ name: 'main', size: 512 }, el.add(sampleRate, signal)))

    const ping = pingPong([analyzed, analyzed], cv.pingpong, cv.synth.bpm)

    const stereo = srvb({
      key: 'srvb',
      sampleRate: 48000,
      size: cv.srvb.size,
      decay: cv.srvb.decay,
      mod: cv.srvb.mod,
      mix: el.mul(cv.srvb.mix, cv.srvb.on),
    }, ...ping)

    core.render(...stereo)

  }

  function play(midi = 57, vel = 1) {
    if (!started.value) { start() }
    if (ctx.state === 'suspended') ctx.resume()
    cycleNote(midi, vel)
  }

  function stop(midi = 57) { cycleNote(midi, 0) }

  const keyOffset = useClamp(2, 0, 4)

  const { midiNote } = useMidi()

  document.addEventListener('keydown', e => {
    if (e.code == 'Digit1') keyOffset.value--
    if (e.code == 'Equal') keyOffset.value++
    if (e.repeat || !noteKeys[e.code]) return
    if (e.ctrlKey || e.altKey || e.metaKey) return
    if (e.code == 'Slash') e.preventDefault()
    // play(noteKeys[e.code] + keyOffset.value * 12, 1)
    Object.assign(midiNote, {
      number: noteKeys[e.code] + keyOffset.value * 12,
      velocity: 1,
      channel: 0,
      timestamp: Date.now(),
      port: 'keyboard'
    })
  })

  document.addEventListener('keyup', e => {
    if (!noteKeys[e.code]) return
    // stop(noteKeys[e.code] + keyOffset.value * 12)
    Object.assign(midiNote, {
      number: noteKeys[e.code] + keyOffset.value * 12,
      velocity: 0,
      channel: 0,
      timestamp: Date.now(),
      port: 'keyboard'
    })
  })

  return { controls, params, keyOffset, groups, play, stop, stopAll, initiated, started, meters, scopes, FFTs, voices }
}
