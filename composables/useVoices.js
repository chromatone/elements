import { reactive, watch, ref } from "vue";
import { el } from "@elemaudio/core";

const parameters = ['gate', 'midi', 'vel']

export function useVoices(VOICE_COUNT = 8) {

  const voices = reactive(Array(VOICE_COUNT)
    .fill(null).map(() =>
      Object.fromEntries(parameters.map((p) =>
        [p, { value: 0, ref: null, setter: null }])
      )
    ))

  const initialized = ref(false)

  function initVoices(core) {
    voices.forEach(voice => {
      parameters.forEach(param => {
        const [ref, setter] = core.createRef('const', { value: voice[param].value }, [])
        voice[param].ref = el.smooth(el.tau2pole(0.001), ref)
        voice[param].setter = setter
      });
    });

    initialized.value = true
  }

  const nextVoiceIndex = ref(0);

  function cycleNote(num, velocity) {
    if (velocity > 0) {

      const index = findNextAvailableVoice(nextVoiceIndex);
      updateVoice(index, { gate: 1, midi: num, vel: velocity })
    } else {
      releaseVoices(voices, num)
    }
  }

  function updateVoice(index, params) {
    if (!initialized.value) return

    const voice = voices[index];
    Object.entries(params).forEach(([param, value]) => {
      if (param in voice && value !== undefined) {
        voice[param].value = value
        voice[param].setter?.({ value })
      }
    });
  }

  function releaseVoices(voiceRefs, midiNote) {
    voiceRefs.forEach((v, i) => {
      if (v.midi.value === midiNote) {
        updateVoice(i, { gate: 0 })
      }
    });
  }

  function stopAll() {
    voices.forEach((_, i) => updateVoice(i, { gate: 0 }))
  }

  function getVoiceParams(index) {
    return Object.fromEntries(parameters.map(p => [p, getVoiceParam(index, p)]))
  }

  function getVoiceParam(index, param) {
    return el.meter({ name: `synth-voice-${index}-${param}` }, voices[index][param].ref || el.const({ value: voices[index][param].value }))
  }

  function findNextAvailableVoice(nextVoiceIndex) {
    const startIndex = nextVoiceIndex.value
    let index = startIndex

    do {
      if (voices[index].gate.value === 0) {
        nextVoiceIndex.value = (index + 1) % voices.length;
        return index;
      }
      index = (index + 1) % voices.length;
    } while (index !== startIndex)

    nextVoiceIndex.value = (startIndex + 1) % voices.length;
    return startIndex;
  }

  return { voices, initVoices, updateVoice, cycleNote, stopAll, getVoiceParams }
}