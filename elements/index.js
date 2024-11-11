import { params as subParams } from './subtractive'
import { params as srvbParams } from './srvb'

export const params = {
  "synth_bpm": { "value": 120, "min": 10, "max": 500, "step": 1 },
  "synth_vol": { "value": 0.5, "min": 0, "max": 1, "step": 0.01 },
  ...subParams,
  ...srvbParams,
}

export * from './subtractive'
export * from './srvb'