import { midiFrequency } from "./index";
import { el } from "@elemaudio/core";


export const params = {
  on: { value: 1, min: 0, max: 1, step: 1, hidden: true, },
  gain: { value: 0.8, min: 0, max: 2, step: 0.01, },
  // cutoff: { value: 200, min: 10, max: 20000, step: 1, },
  // cutq: { value: 1.1, min: 0, max: 5, step: 0.1, },
  attack: { value: 1, min: 0.01, max: 10, step: 0.01, hidden: true, },
  decay: { value: 1, min: 0.1, max: 10, step: 0.1, hidden: true, },
  sustain: { value: 0.5, min: 0, max: 1, step: 0.01, hidden: true, },
  release: { value: 1, min: 0.1, max: 10, step: 0.1, hidden: true, },
}


export function createSampler({ gate, midi, vel }, cv, bpm) {

  const freq = midiFrequency(midi)

  let rate = el.div(15, bpm)

  const envelope = el.adsr(
    el.mul(cv.attack, rate),
    el.mul(cv.decay, rate),
    cv.sustain,
    el.mul(cv.release, rate),
    gate
  );

  const sample = el.sample({ path: 'piano' }, gate, el.div(freq, 440))

  const shaped = el.mul(sample, vel, envelope, cv.on, cv.gain)

  return el.mul(48, el.compress(10, 100, -48, 2, shaped, shaped))
}