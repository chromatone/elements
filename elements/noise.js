import { midiFrequency } from "./index";
import { el } from "@elemaudio/core";

export const params = {
  on: { value: 1, min: 0, max: 1, step: 1, hidden: true, },
  gain: { value: 0.8, min: 0, max: 2, step: 0.01, },
  octave: { value: 0, min: -2, max: 2, step: 1 },
  color: { value: 0, min: 0, max: 1, step: 0.001, },
  bandq: { value: 5, min: 0, max: 10, step: 0.1, },
  cutoff: { value: 200, min: 10, max: 20000, step: 1, },
  cutq: { value: 1.1, min: 0, max: 5, step: 0.1, },
  attack: { value: 1, min: 0.01, max: 10, step: 0.01, hidden: true, },
  decay: { value: 1, min: 0.1, max: 10, step: 0.1, hidden: true, },
  sustain: { value: 0.5, min: 0, max: 1, step: 0.01, hidden: true, },
  release: { value: 1, min: 0.1, max: 10, step: 0.1, hidden: true, },
  fenv: { value: 0.5, min: -.95, max: 8, step: 0.01, },
  fattack: { value: 1, min: 0.01, max: 10, step: 0.01, hidden: true, },
  fdecay: { value: 1, min: 0.1, max: 10, step: 0.1, hidden: true, },
  fsustain: { value: 0.5, min: 0, max: 1, step: 0.01, hidden: true, },
  frelease: { value: 1, min: 0.01, max: 10, step: 0.1, hidden: true, },
};

export function createNoise({ gate, midi, vel }, cv, bpm) {

  let freq = el.mul(el.pow(2, cv.octave), midiFrequency(midi))

  let rate = el.div(15, bpm)

  const envelope = el.adsr(
    el.mul(cv.attack, rate),
    el.mul(cv.decay, rate),
    cv.sustain,
    el.mul(cv.release, rate),
    gate
  );

  const filterEnvelope = el.adsr(
    el.mul(cv.fattack, rate),
    el.mul(cv.fdecay, rate),
    cv.fsustain,
    el.mul(cv.frelease, rate),
    gate
  );

  const whiteGain = el.cos(el.mul(cv.color, Math.PI / 2));
  const pinkGain = el.sin(el.mul(cv.color, Math.PI / 2));

  const noiseSrc = el.add(
    el.mul(whiteGain, el.noise()),
    el.mul(pinkGain, el.pinknoise())
  );

  const filter = el.bandpass(freq, cv.bandq, noiseSrc);

  const filterCutoff = el.max(20, el.min(20000, el.add(
    cv.cutoff,
    el.mul(
      el.mul(cv.fenv, 20000),
      filterEnvelope
    )
  )))

  const lowpass = el.lowpass(
    filterCutoff,
    cv.cutq,
    filter
  );

  return el.tanh(el.mul(cv.on, cv.gain, vel, envelope, lowpass))
}