import { el } from "@elemaudio/core";

export const params = {
  pingpong_on: { value: 1, min: 0, max: 1, step: 1, hidden: true },
  pingpong_gain: { value: 0.1, min: 0, max: 1, step: 0.01 },
  pingpong_feedback: { value: 0.1, min: 0, max: 1, step: 0.01 },
  pingpong_shift: { value: 0.4, min: 0, max: 1, step: 0.01 },
};

export function pingPong([left, right], cv) {
  return [0, 1].map((i) =>
    el.add(
      i ? right || left : left,
      el.mul(
        cv.pingpong_on,
        cv.pingpong_gain,
        el.delay(
          { size: 44100 },
          el.ms2samps(
            el.mul(
              el.div(60000, cv.synth_bpm),
              el.add(1, el.mul(i === 0 ? -0.5 : 0.5, cv.pingpong_shift))
            )
          ),
          cv.pingpong_feedback,
          i ? right || left : left
        )
      )
    )
  );
}
