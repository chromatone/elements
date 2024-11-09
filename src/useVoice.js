import { el } from '@elemaudio/core'

export function useVoice({ gate, midi, vel }, cv) {
  return el.mul(gate, vel, cv.synth_vol, el.tanh(el.cycle(midiFrequency(midi))))
}

export const midiFrequency = x => el.mul(440, el.pow(2, el.smooth(el.tau2pole(0.001), el.div(el.sub(x, 69), 12))))