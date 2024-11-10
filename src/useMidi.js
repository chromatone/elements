import { WebMidi, Note, Utilities } from "webmidi";
import { reactive, computed, watchEffect, onMounted, ref, watch, shallowReactive } from 'vue';

const inputs = shallowReactive({})
const outputs = shallowReactive({})


const midi = reactive({
  enabled: false,
  playing: false,
  stopped: true
})

export function useMidi() {
  onMounted(() => setupMidi())
  return { midi, inputs, outputs, WebMidi }
}

function setupMidi() {
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
  }).catch(e => console.log(e))
}

function initMidi() {
  WebMidi.inputs.forEach(input => {
    inputs[input.id] = {
      name: input.name,
      manufacturer: input.manufacturer,
      forwarder: input.addForwarder(),
    }
    input.removeListener();
    setupInputListeners(input);
  })
  WebMidi.outputs.forEach(output => {
    outputs[output.id] = {
      name: output.name,
      manufacturer: output.manufacturer,
    }
  })
}

function setupInputListeners(input) {
  Object.entries({
    start: () => { midi.playing = true; midi.stopped = false; },
    stop: () => { midi.playing = false; midi.stopped = Date.now(); },
    // clock: handleClock(input),
    // midimessage: handleMidiMessage(input),
    // noteon: ev => inputs[input.id].note = noteInOn(ev),
    // noteoff: ev => inputs[input.id].note = noteInOn(ev),
    // controlchange: handleControlChange(input),
    // channelaftertouch: handleMonoAftertouch(input),
    // keyaftertouch: handlePolyAftertouch(input),
    // pitchbend: handlePitchBend(input),
  }).forEach(([event, handler]) => {
    input.addListener(event, handler);
  });
}
