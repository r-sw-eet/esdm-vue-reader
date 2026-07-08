<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import BpmnModeler from 'bpmn-js/lib/Modeler'
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel'
import EsdmPropertiesProvider from '../esdm-properties-provider.js'
import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css'
import '@bpmn-io/properties-panel/dist/assets/properties-panel.css'

// The diagram comes from the connected app (GET /_dev/bpmn, 0004 §3).
const props = defineProps({ source: String })

const canvas = ref(null)
const panel = ref(null)
const status = ref('')
const hasSource = (props.source || '').trim().length > 0
let modeler = null

const BLANK = '<?xml version="1.0" encoding="UTF-8"?>' +
  '<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">' +
  '<bpmn:process id="Process_1" isExecutable="true"><bpmn:startEvent id="StartEvent_1"/></bpmn:process>' +
  '<bpmndi:BPMNDiagram id="BPMNDiagram_1"><bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">' +
  '<bpmndi:BPMNShape id="_S" bpmnElement="StartEvent_1"><dc:Bounds x="180" y="100" width="36" height="36"/></bpmndi:BPMNShape>' +
  '</bpmndi:BPMNPlane></bpmndi:BPMNDiagram></bpmn:definitions>'

let resizeObserver = null
function fit() {
  if (!modeler) return
  try {
    const c = modeler.get('canvas')
    c.resized()              // re-measure the container (bpmn-js caches it on init)
    c.zoom('fit-viewport')
  } catch (e) {}
}

onMounted(async () => {
  modeler = new BpmnModeler({
    container: canvas.value,
    propertiesPanel: { parent: panel.value },
    additionalModules: [BpmnPropertiesPanelModule, BpmnPropertiesProviderModule, EsdmPropertiesProvider],
  })
  try {
    await modeler.importXML(hasSource ? props.source : BLANK)
    status.value = hasSource ? "this app's diagram" : 'blank canvas — start modeling'
  } catch (e) {
    status.value = 'import error: ' + e.message
  }
  // Re-fit whenever the canvas gets its real size (flex layout / panel settling).
  resizeObserver = new ResizeObserver(() => fit())
  resizeObserver.observe(canvas.value)
})
onBeforeUnmount(() => { if (resizeObserver) resizeObserver.disconnect(); if (modeler) modeler.destroy() })

async function exportXml() {
  const { xml } = await modeler.saveXML({ format: true })
  const blob = new Blob([xml], { type: 'application/bpmn+xml' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'model.bpmn'
  a.click()
  URL.revokeObjectURL(a.href)
  status.value = 'exported model.bpmn → save to authoring/ then run: esdmgen bpmn:map'
}
</script>

<template>
  <div class="space-y-3">
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex items-center gap-3 text-sm">
      <font-awesome-icon :icon="['fas', 'diagram-project']" class="text-sky-600" />
      <span class="text-slate-600"><b>BPMN authoring</b> — bpmn.io modeler · <span class="text-slate-400">{{ status }}</span></span>
      <button
        @click="exportXml"
        class="ml-auto rounded-md bg-slate-900 text-white px-3 py-1.5 hover:bg-slate-700 flex items-center gap-2"
      >
        <font-awesome-icon :icon="['fas', 'download']" /> Export .bpmn
      </button>
    </div>
    <div class="flex gap-3" style="height: 72vh;">
      <div ref="canvas" class="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"></div>
      <div ref="panel" class="w-96 shrink-0 overflow-auto bg-white rounded-xl shadow-sm border border-slate-200"></div>
    </div>
    <p class="text-xs text-slate-400">
      Select a <b>sequence flow</b> → the <b>ESDM rule (FEEL)</b> field lets you type a guard (e.g. <code>paidAmount &gt;= total</code>).
      Export, save to <code>authoring/</code>, then <code>esdmgen bpmn:map</code> re-emits the ESDM model; the guard becomes an <code>admits[].when</code>.
    </p>
  </div>
</template>
