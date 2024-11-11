import { el } from '@elemaudio/core'

export function useVoice(index, { gate, midi, vel }, cv) {

  const voice = el.add(
    createOscillator({ gate, midi, vel }, cv)
  )

  return voice
}

export const midiFrequency = x => el.mul(440, el.pow(2, el.smooth(el.tau2pole(0.001), el.div(el.sub(x, 69), 12))))

function createOscillator({ gate, midi, vel }, cv) {
  const squareOsc = el.blepsquare(midiFrequency(midi));
  const sawOsc = el.blepsaw(midiFrequency(midi));

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