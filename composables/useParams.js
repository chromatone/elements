import { el } from '@elemaudio/core'
import { reactive, watch, ref, shallowReactive, computed } from "vue";
import { useClamp } from "@vueuse/math";
import { useStorage } from "@vueuse/core";

export function useParams(params, title = "ref") {

  const controls = reactive({})
  const cv = shallowReactive({})
  const setters = shallowReactive({})
  const groups = shallowReactive({})

  let refsInitiated = false

  for (let g in params) {
    const group = params[g]
    for (let p in group) {
      const param = group[p]
      controls[g] = controls[g] || {}
      controls[g][p] = useClamp(
        param?.nostore ? param.value : useStorage(`${title}:${g}_${p}`, param.value),
        param.min,
        param.max
      )
      if (param?.hidden) continue
      groups[g] = groups[g] || {}
      groups[g][p] = param;
    }
  }

  function initRefs(core) {
    for (let g in params) {
      const group = params[g]
      for (let p in group) {
        let [node, setter] = core.createRef("const", { value: controls[g][p] }, [])
        cv[g] = cv[g] || {}
        cv[g][p] = el.smooth(el.tau2pole(0.01), node)
        setters[g] = setters[g] || {}
        setters[g][p] = setter
      }
    }
    refsInitiated = true
  }

  watch(() => ({ ...controls }), (c1, c2) => {
    if (!refsInitiated) return
    for (let g in controls) {
      const group = params[g]
      for (let p in group) {
        if (c1[g][p] != c2[g][p]) {
          setters[g][p]({ value: controls[g][p] });
        }
      }
    }
  })

  return { controls, cv, setters, groups, initRefs }
}
