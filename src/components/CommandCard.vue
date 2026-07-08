<script setup>
import { reactive, ref, watch, computed } from 'vue'
import { postCommand } from '../api.js'

const props = defineProps({ command: Object, selectedId: String, embedded: Boolean })
const emit = defineEmits(['result'])

const form = reactive({})
// Pre-fill an `id` field from the current selection; keep it in sync while open.
for (const f of props.command.fields) {
  form[f.name] = f.type === 'boolean' ? false : f.name === 'id' ? props.selectedId : ''
}

watch(() => props.selectedId, (v) => { if ('id' in form) form.id = v })

const icon = computed(() => ({ create: 'plus', delete: 'trash' }[props.command.lifecycle] || 'pen'))
const tone = computed(() => ({ create: 'text-emerald-600', delete: 'text-rose-600' }[props.command.lifecycle] || 'text-sky-600'))

// FEEL value picker: a field referenced by a FEEL guard offers conform values.
const openFeel = ref('')
function toggleFeel(name) { openFeel.value = openFeel.value === name ? '' : name }
function hasFeel(f) { return f.feel && (f.feel.temporal || (f.feel.values && f.feel.values.length)) }

function datePresets() {
  const mk = (label, mutate) => { const d = new Date(); mutate(d); return { label, date: d } }
  return [
    mk('today', () => {}),
    mk('+1 week', (d) => d.setDate(d.getDate() + 7)),
    mk('+1 month', (d) => d.setMonth(d.getMonth() + 1)),
    mk('+3 months', (d) => d.setMonth(d.getMonth() + 3)),
    mk('+1 year', (d) => d.setFullYear(d.getFullYear() + 1)),
  ]
}
function applyDate(f, d) {
  form[f.name] = f.feel.temporal === 'datetime' ? d.toISOString().slice(0, 16) : d.toISOString().slice(0, 10)
  openFeel.value = ''
}
function applyValue(f, v) { form[f.name] = v; openFeel.value = '' }

function cast(f) {
  if (f.type === 'boolean') return !!form[f.name]
  if (f.type === 'integer') return parseInt(form[f.name] || 0, 10)
  if (f.type === 'number') return parseFloat(form[f.name] || 0)
  return form[f.name]
}

async function send() {
  const body = {}
  for (const f of props.command.fields) body[f.name] = cast(f)
  const res = await postCommand(props.command.path, body)
  emit('result', { command: props.command, ...res })
}
</script>

<template>
  <form @submit.prevent="send" :class="embedded ? '' : 'bg-white rounded-xl shadow-sm border border-slate-200 p-4'">
    <div v-if="!embedded" class="flex items-center gap-2 mb-3">
      <font-awesome-icon :icon="['fas', icon]" :class="tone" />
      <span class="font-medium text-slate-800">{{ command.name }}</span>
      <span class="ml-auto text-[10px] uppercase tracking-wide text-slate-400">{{ command.lifecycle }}</span>
    </div>

    <div v-for="f in command.fields" :key="f.name" class="mb-2 relative">
      <label class="text-xs text-slate-500 mb-1 flex items-center gap-1">
        <span>{{ f.name }} <span class="text-slate-300">: {{ f.type }}</span></span>
        <button
          v-if="hasFeel(f)"
          type="button"
          @click="toggleFeel(f.name)"
          class="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 border border-violet-200 hover:bg-violet-200 flex items-center gap-1"
        >
          <font-awesome-icon :icon="['fas', 'wand-magic-sparkles']" /> FEEL
        </button>
      </label>
      <input v-if="f.type === 'boolean'" type="checkbox" v-model="form[f.name]" class="h-4 w-4" />
      <input
        v-else
        :type="f.type === 'integer' || f.type === 'number' ? 'number' : 'text'"
        v-model="form[f.name]"
        class="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
      />

      <div
        v-if="openFeel === f.name"
        class="absolute z-20 mt-1 right-0 w-64 bg-white rounded-lg shadow-xl border border-slate-200 p-2.5 text-xs"
      >
        <div class="text-[10px] uppercase tracking-wider text-slate-400 mb-1">FEEL-conform values</div>
        <div v-for="r in f.feel.rules" :key="r" class="font-mono text-[10px] text-slate-500 mb-1.5">{{ r }}</div>
        <div v-if="f.feel.temporal" class="flex flex-wrap gap-1">
          <button
            v-for="p in datePresets()"
            :key="p.label"
            type="button"
            @click="applyDate(f, p.date)"
            class="px-2 py-0.5 rounded bg-sky-100 text-sky-700 border border-sky-200 hover:bg-sky-200"
          >{{ p.label }}</button>
        </div>
        <div v-if="f.feel.values && f.feel.values.length" class="flex flex-wrap gap-1">
          <button
            v-for="v in f.feel.values"
            :key="v"
            type="button"
            @click="applyValue(f, v)"
            class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200"
          >{{ v }}</button>
        </div>
      </div>
    </div>

    <button class="mt-2 w-full rounded-md bg-slate-900 text-white text-sm py-1.5 hover:bg-slate-700 flex items-center justify-center gap-2">
      <font-awesome-icon :icon="['fas', 'paper-plane']" /> Send
    </button>
  </form>
</template>