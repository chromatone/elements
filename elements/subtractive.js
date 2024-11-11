import { midiFrequency } from "./midi";
import { el } from "@elemaudio/core";

export const params = {
  on: { value: 1, min: 0, max: 1, step: 1, hidden: true, },
  gain: { value: 0.8, min: 0, max: 2, step: 0.01, },
  shape: { value: 0.2, min: 0, max: 1, step: 0.01, },
  vibdep: { value: 0.1, min: 0, max: .5, step: 0.01, fixed: 2 },
  vibrate: { value: 2, min: 1, max: 8, step: 0.01, },
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

export function createSubtractive({ gate, midi, vel }, cv, bpm) {

  const freq = midiFrequency(el.add(midi,
    el.mul(cv.vibdep,
      el.cycle(
        el.mul(
          cv.vibrate,
          el.div(bpm, 60))))))

  const squareOsc = el.blepsquare(freq);
  const sawOsc = el.blepsaw(freq);

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

  const oscillator = el.mul(envelope, el.add(
    el.mul(el.cos(el.mul(cv.shape, Math.PI / 2)), squareOsc),
    el.mul(el.sin(el.mul(cv.shape, Math.PI / 2)), sawOsc)
  ))

  const filterCutoff = el.add(
    cv.cutoff,
    el.mul(cv.cutoff, el.mul(cv.fenv, filterEnvelope))
  );

  const filter = el.lowpass(
    el.max(20, el.min(20000, filterCutoff)),
    cv.cutq,
    oscillator
  );

  return el.tanh(el.mul(cv.on, cv.gain, vel, filter));
}


