import { WebMidi } from "webmidi";
import { reactive, onMounted, shallowReactive, computed } from 'vue';
import { Midi } from "tonal";
import { Chord } from "tonal";

const inputs = shallowReactive({})
const outputs = shallowReactive({})

const midi = reactive({
  enabled: false,
  playing: false,
  stopped: true
})

const midiNote = reactive({
  number: 57,
  velocity: 0,
  channel: 1,
  timestamp: 0,
  port: null
})

const activeNotes = reactive({})

const midiLog = shallowReactive([])

export const guessChords = computed(() => {
  const list = Object.entries(activeNotes).filter(([_, v]) => v).map(([n]) => Midi.midiToNoteName(Number(n), { sharps: true }));
  return Chord.detect(list)
})

export function useMidi() {
  onMounted(() => {
    if (midi.enabled || midi.enabled === null) return
    WebMidi.enable().then(() => {
      midi.enabled = true
      initMidi()
      WebMidi.addListener("connected", initMidi)
      WebMidi.addListener("disconnected", e => {
        if (e.port.type == 'input') {
          delete inputs[e.port.id]
        } else if (e.port.type == 'output') {
          delete outputs[e.port.id]
        }
      })
    }).catch(e => midi.enabled = null)
  })
  return { midi, inputs, outputs, WebMidi, midiLog, midiNote, activeNotes, guessChords }
}



function initMidi() {
  WebMidi.inputs.forEach(input => {
    inputs[input.id] = {
      name: input.name,
      manufacturer: input.manufacturer,
      event: null
    }

    input.removeListener()

    input.addListener('start', () => { midi.playing = true; midi.stopped = false; })
    input.addListener('stop', () => { midi.playing = false; midi.stopped = Date.now(); })
    input.addListener('midimessage', ev => {
      if (ev?.message?.type === "clock") return
      const { timestamp, message } = ev
      inputs[input.id].message = message
      midiLog.unshift({ timestamp, message })
      if (midiLog.length > 100) midiLog.pop()
    })

    input.addListener('noteon', onNote)
    input.addListener('noteoff', onNote)

    function onNote({ type, note: { number, attack }, message: { channel }, timestamp, port: { id } }) {
      const velocity = type == 'noteoff' ? 0 : attack
      Object.assign(midiNote, {
        number,
        velocity,
        channel,
        timestamp,
        port: id
      })
      activeNotes[number] = velocity
    }

    // controlchange: handleControlChange(input),
    // channelaftertouch: handleMonoAftertouch(input),
    // keyaftertouch: handlePolyAftertouch(input),
    // pitchbend: ev => {     },

  })
  WebMidi.outputs.forEach(output => {
    outputs[output.id] = {
      name: output.name,
      manufacturer: output.manufacturer,
    }
  })
}

