import { WebMidi } from "webmidi";
import { reactive, onMounted, onUnmounted, shallowReactive, shallowRef, computed } from 'vue';
import { Midi } from "tonal";
import { Chord } from "tonal";

const inputs = shallowReactive({})
const outputs = shallowReactive({})

const midi = reactive({
  enabled: false,
  playing: false,
  stopped: true,
  channel: 1
})

const midiNote = reactive({
  number: 57,
  velocity: 0,
  channel: 1,
  timestamp: 0,
  port: null
})

const activeNotes = reactive({})

// FIX: circular buffer instead of reactive array with unshift/pop
const MIDI_LOG_MAX = 100
const midiLogBuffer = new Array(MIDI_LOG_MAX)
let midiLogIndex = 0
let midiLogCount = 0
export const midiLogVersion = shallowRef(0)

// Expose a read-only view for the UI
export const midiLog = {
  get length() { return midiLogCount },
  [Symbol.iterator]() {
    let i = 0
    const count = midiLogCount
    const start = count < MIDI_LOG_MAX ? 0 : midiLogIndex
    return {
      next() {
        if (i >= count) return { done: true }
        const idx = (start + i) % MIDI_LOG_MAX
        i++
        return { value: midiLogBuffer[idx] }
      }
    }
  }
}

export const guessChords = computed(() => {
  const list = Object.entries(activeNotes).filter(([_, v]) => v).map(([n]) => Midi.midiToNoteName(Number(n), { sharps: true }));
  return Chord.detect(list)
})

// FIX: track cleanup functions for proper teardown
let cleanupFns = []

export function useMidi() {
  onMounted(() => {
    if (midi.enabled || midi.enabled === null) return
    WebMidi.enable().then(() => {
      midi.enabled = true
      initMidi()

      // FIX: store references so we can remove them later
      const onConnected = () => initMidi()
      const onDisconnected = (e) => {
        if (e.port.type == 'input') {
          delete inputs[e.port.id]
        } else if (e.port.type == 'output') {
          delete outputs[e.port.id]
        }
      }

      WebMidi.addListener("connected", onConnected)
      WebMidi.addListener("disconnected", onDisconnected)

      cleanupFns.push(() => {
        WebMidi.removeListener("connected", onConnected)
        WebMidi.removeListener("disconnected", onDisconnected)
      })
    }).catch(e => midi.enabled = null)
  })

  // FIX: clean up all WebMidi listeners on unmount
  onUnmounted(() => {
    cleanupFns.forEach(fn => fn())
    cleanupFns = []
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

      // FIX: circular buffer write — O(1) instead of O(n) unshift
      midiLogBuffer[midiLogIndex] = { timestamp, message }
      midiLogIndex = (midiLogIndex + 1) % MIDI_LOG_MAX
      midiLogCount = Math.min(midiLogCount + 1, MIDI_LOG_MAX)
      midiLogVersion.value++
    })

    input.addListener('noteon', onNote)
    input.addListener('noteoff', onNote)

    function onNote({ type, note: { number, attack }, message: { channel }, timestamp, port: { id } }) {
      if (midi.channel !== null && channel !== midi.channel) return
      const velocity = type === 'noteoff' ? 0 : attack
      Object.assign(midiNote, {
        number,
        velocity,
        channel,
        timestamp,
        port: id
      })
      activeNotes[number] = velocity
    }
  })
  WebMidi.outputs.forEach(output => {
    outputs[output.id] = {
      name: output.name,
      manufacturer: output.manufacturer,
    }
  })
} 