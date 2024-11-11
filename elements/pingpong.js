import { el } from "@elemaudio/core";

export const params = {
  on: { value: 1, min: 0, max: 1, step: 1, hidden: true },
  gain: { value: 0.1, min: 0, max: 1, step: 0.01 },
  feedback: { value: 0.1, min: 0, max: 1, step: 0.01 },
  shift: { value: 0.4, min: 0, max: 1, step: 0.01 },
};

export function pingPong([left, right], cv, bpm) {
  return [0, 1].map((i) =>
    el.add(
      i ? right || left : left,
      el.mul(
        cv.on,
        cv.gain,
        el.delay(
          { size: 44100 },
          el.ms2samps(
            el.mul(
              el.div(60000, bpm),
              el.add(1, el.mul(i === 0 ? -0.5 : 0.5, cv.shift))
            )
          ),
          cv.feedback,
          i ? right || left : left
        )
      )
    )
  );
}
