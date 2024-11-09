import WebRenderer from '@elemaudio/web-renderer'
import { el } from '@elemaudio/core'
import { reactive, watch, ref, shallowReactive } from "vue";
import { useClamp } from "@vueuse/math";
import { useStorage } from "@vueuse/core";

const initiated = ref(false)
const started = ref(false)

let ctx, core

const params = {
  "synth:trigger": { "value": 0, "min": 0, "max": 1, "step": 0.01, nostore: true },
}

const { controls, cv, groups, initRefs } = useParams(params, 'el')

export function useSynth() {

  function play() {
    if (!started.value) { start() }
    controls['synth:trigger'] = 1
  }

  function stop() { controls['synth:trigger'] = 0 }

  return { controls, groups, play, stop, initiated, started }
}


function useSignal({ trigger = 0 }) {
  const signal = el.mul(
    el.smooth(
      el.tau2pole(0.01),
      trigger),
    el.cycle(220))
  return [signal, signal]
}

async function start() {

  if (initiated.value) return
  ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') await ctx.resume()
  core = new WebRenderer()
  const node = await core.initialize(ctx, {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [2],
  })
  node.connect(ctx.destination)
  initRefs(core)

  const stereo = useSignal({
    trigger: cv['synth:trigger']
  })
  core.render(...stereo)

  initiated.value = true
  started.value = true
}


export function useParams(params, title = "ref") {

  const controls = reactive({})
  const cv = shallowReactive({})
  const setters = shallowReactive({})
  const groups = shallowReactive({})

  let refsInitiated = false

  for (let key in params) {
    const param = params[key]
    controls[key] = useClamp(
      param?.nostore ? param.value : useStorage(`${title}:${key}`, param.value),
      param.min,
      param.max
    )
    if (param?.hidden) continue
    const [group, name] = key.split(":")
    if (!group || !name) continue
    groups[group] = groups[group] || {}
    groups[group][name] = param;
  }

  function initRefs(core) {
    for (let key in params) {
      let [node, setter] = core.createRef("const", { value: controls[key] }, []);
      cv[key] = el.smooth(el.tau2pole(0.01), node);
      setters[key] = setter
    }
    refsInitiated = true
  }

  watch(() => ({ ...controls }), (c1, c2) => {
    if (!refsInitiated) return
    for (let c in controls) {
      if (c1[c] != c2[c]) {
        setters[c]({ value: controls[c] });
      }
    }
  })

  return { controls, cv, setters, groups, initRefs }
}


