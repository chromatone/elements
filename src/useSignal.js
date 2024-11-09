import { el } from '@elemaudio/core'
import { srvb } from './srvb'

export const params = {
  "synth_trigger": { "value": 0, "min": 0, "max": 1, "step": 0.01, "nostore": true },
  "synth_midi": { "value": 57, "min": 0, "max": 127, "step": 0.01 },
  "reverb_on": { "value": 1, "min": 0, "max": 1, "step": 1, "hidden": true },
  "reverb_size": { "value": 0.2, "min": 0, "max": 1, "step": 0.01 },
  "reverb_decay": { "value": 0.5, "min": 0, "max": 1, "step": 0.01 },
  "reverb_mod": { "value": 0.5, "min": 0, "max": 1, "step": 0.01 },
  "reverb_mix": { "value": 0.5, "min": 0, "max": 1, "step": 0.01 }
}

export function useSignal(cv) {
  const sampleRate = el.mul(0, el.meter({ name: 'sample-rate' }, el.sr()))

  const signal = el.fft({
    name: 'synth',
    size: 2048
  }, el.scope({ name: 'synth', size: 512 }, el.add(sampleRate, el.mul(
    cv.synth_trigger,
    el.cycle(midiFrequency(cv.synth_midi))))))

  let rev = srvb({
    key: 'srvb',
    sampleRate: 48000,
    size: cv.reverb_size,
    decay: cv.reverb_decay,
    mod: cv.reverb_mod,
    mix: el.mul(cv.reverb_mix, cv.reverb_on),
  }, signal, signal)

  return rev
}


export const midiFrequency = x => el.mul(440, el.pow(2, el.smooth(el.tau2pole(0.001), el.div(el.sub(x, 69), 12))))