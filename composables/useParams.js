import { el } from '@elemaudio/core'
import { reactive, watch, ref, shallowReactive } from "vue";
import { useClamp } from "@vueuse/math";
import { useStorage } from "@vueuse/core";

export function useParams(params, title = "ref") {

  const controls = reactive({})
  const cv = shallowReactive({})
  const setters = shallowReactive({})
  const groups = shallowReactive({})

  let refsInitialized = false

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
    refsInitialized = true
  }

  // FIX: per-group watchers instead of one deep watch on the entire tree.
  // Each group watcher only traverses its own parameters, not the whole object.
  for (let g in params) {
    watch(
      () => controls[g],
      (groupControls) => {
        if (!refsInitialized) return
        const group = params[g]
        for (let p in group) {
          setters[g]?.[p]?.({ value: groupControls[p] })
        }
      },
      { deep: true }
    )
  }

  return { controls, cv, setters, groups, initRefs }
}