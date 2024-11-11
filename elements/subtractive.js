import { el } from '@elemaudio/core'

export function createSubtractive({ gate, freq, vel }, cv) {
  const squareOsc = el.blepsquare(freq);
  const sawOsc = el.blepsaw(freq);

  const envelope = el.adsr(
    el.div(el.mul(15, cv.osc_attack), cv.synth_bpm),
    el.div(el.mul(15, cv.osc_decay), cv.synth_bpm),
    cv.osc_sustain,
    el.div(el.mul(15, cv.osc_release), cv.synth_bpm),
    gate);

  const filterEnvelope = el.adsr(
    el.div(el.mul(15, cv.osc_fattack), cv.synth_bpm),
    el.div(el.mul(15, cv.osc_fdecay), cv.synth_bpm),
    cv.osc_fsustain,
    el.div(el.mul(15, cv.osc_frelease), cv.synth_bpm),
    gate
  );

  const squareGain = el.cos(el.mul(cv.osc_shape, Math.PI / 2));
  const sawGain = el.sin(el.mul(cv.osc_shape, Math.PI / 2));

  const oscillator = el.add(
    el.mul(squareGain, squareOsc),
    el.mul(sawGain, sawOsc)
  );

  const filterCutoff = el.add(
    cv.osc_cutoff,
    el.mul(
      el.mul(cv.osc_fenv, 20000),
      filterEnvelope
    )
  );

  const filter = el.lowpass(
    el.max(20, el.min(20000, filterCutoff)),
    cv.osc_cutq,
    oscillator
  );

  return el.tanh(el.mul(cv.osc_on, cv.osc_gain, envelope, vel, filter))
}


export const params = {
  "osc_on": { "value": 1, "min": 0, "max": 1, "step": 1, "hidden": true },
  "osc_gain": { "value": 0.8, "min": 0, "max": 2, "step": 0.01 },
  "osc_shape": { "value": 0.2, "min": 0, "max": 1, "step": 0.01 },
  "osc_cutoff": {
    "value": 200,
    "min": 10,
    "max": 20000,
    "step": 1
  },
  "osc_cutq": {
    "value": 1.1,
    "min": 0,
    "max": 5,
    "step": 0.1
  },
  "osc_attack": {
    "value": 1,
    "min": 0.01,
    "max": 10,
    "step": 0.01,
    "hidden": true
  },
  "osc_decay": {
    "value": 1,
    "min": 0.1,
    "max": 10,
    "step": 0.1,
    "hidden": true
  },
  "osc_sustain": {
    "value": 0.5,
    "min": 0,
    "max": 1,
    "step": 0.01,
    "hidden": true
  },
  "osc_release": {
    "value": 1,
    "min": 0.1,
    "max": 10,
    "step": 0.1,
    "hidden": true
  },
  "osc_fenv": {
    "value": 0.5,
    "min": 0,
    "max": 1,
    "step": 0.01
  },
  "osc_fattack": {
    "value": 1,
    "min": 0.01,
    "max": 10,
    "step": 0.01,
    "hidden": true
  },
  "osc_fdecay": {
    "value": 1,
    "min": 0.1,
    "max": 10,
    "step": 0.1,
    "hidden": true
  },
  "osc_fsustain": {
    "value": 0.5,
    "min": 0,
    "max": 1,
    "step": 0.01,
    "hidden": true
  },
  "osc_frelease": {
    "value": 1,
    "min": 0.01,
    "max": 10,
    "step": 0.1,
    "hidden": true
  },
}