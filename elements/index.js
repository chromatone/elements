import { params as fat } from './fat'
import { params as srvb } from './srvb'
import { params as pingpong } from './pingpong'
import { params as noise } from './noise'
import { params as string } from './string'
import { params as sampler } from './sampler'

export const params = {
  synth: {
    "bpm": { "value": 120, "min": 10, "max": 500, "step": 1 },
    "vol": { "value": 0.5, "min": 0, "max": 1, "step": 0.01 },
  },
  srvb,
  pingpong,
  fat,
  noise,
  string,
  sampler
}


import { el } from '@elemaudio/core'

export const midiFrequency = x => el.mul(440, el.pow(2, el.smooth(el.tau2pole(0.001), el.div(el.sub(x, 69), 12))))