import { midiFrequency } from "./midi";
import { el } from "@elemaudio/core";

export const params = {
  osc_on: { value: 1, min: 0, max: 1, step: 1, hidden: true, },
  osc_gain: { value: 0.8, min: 0, max: 2, step: 0.01, },
  osc_shape: { value: 0.2, min: 0, max: 1, step: 0.01, },
  osc_vibdep: { value: 0.1, min: 0, max: .5, step: 0.01, fixed: 2 },
  osc_vibrate: { value: 2, min: 1, max: 8, step: 0.01, },
  osc_cutoff: { value: 200, min: 10, max: 20000, step: 1, },
  osc_cutq: { value: 1.1, min: 0, max: 5, step: 0.1, },
  osc_attack: { value: 1, min: 0.01, max: 10, step: 0.01, hidden: true, },
  osc_decay: { value: 1, min: 0.1, max: 10, step: 0.1, hidden: true, },
  osc_sustain: { value: 0.5, min: 0, max: 1, step: 0.01, hidden: true, },
  osc_release: { value: 1, min: 0.1, max: 10, step: 0.1, hidden: true, },
  osc_fenv: { value: 0.5, min: -.95, max: 8, step: 0.01, },
  osc_fattack: { value: 1, min: 0.01, max: 10, step: 0.01, hidden: true, },
  osc_fdecay: { value: 1, min: 0.1, max: 10, step: 0.1, hidden: true, },
  osc_fsustain: { value: 0.5, min: 0, max: 1, step: 0.01, hidden: true, },
  osc_frelease: { value: 1, min: 0.01, max: 10, step: 0.1, hidden: true, },
};

export function createSubtractive({ gate, midi, vel }, cv) {

  const freq = midiFrequency(el.add(midi,
    el.mul(cv.osc_vibdep,
      el.cycle(
        el.mul(
          cv.osc_vibrate,
          el.div(cv.synth_bpm, 60))))))

  const squareOsc = el.blepsquare(freq);
  const sawOsc = el.blepsaw(freq);

  let rate = el.div(15, cv.synth_bpm)

  const envelope = el.adsr(
    el.mul(cv.osc_attack, rate),
    el.mul(cv.osc_decay, rate),
    cv.osc_sustain,
    el.mul(cv.osc_release, rate),
    gate
  );

  const filterEnvelope = el.adsr(
    el.mul(cv.osc_fattack, rate),
    el.mul(cv.osc_fdecay, rate),
    cv.osc_fsustain,
    el.mul(cv.osc_frelease, rate),
    gate
  );

  const oscillator = el.mul(envelope, el.add(
    el.mul(el.cos(el.mul(cv.osc_shape, Math.PI / 2)), squareOsc),
    el.mul(el.sin(el.mul(cv.osc_shape, Math.PI / 2)), sawOsc)
  ))

  const filterCutoff = el.add(
    cv.osc_cutoff,
    el.mul(cv.osc_cutoff, el.mul(cv.osc_fenv, filterEnvelope))
  );

  const filter = el.lowpass(
    el.max(20, el.min(20000, filterCutoff)),
    cv.osc_cutq,
    oscillator
  );

  return el.tanh(el.mul(cv.osc_on, cv.osc_gain, vel, filter));
}


