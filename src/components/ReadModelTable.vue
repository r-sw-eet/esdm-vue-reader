<script setup>
import { computed } from 'vue'
import StateMachineView from './StateMachineView.vue'

const props = defineProps({ readModel: Object, rows: Array, selectedId: String })
const emit = defineEmits(['select', 'activate'])

function onActivate(name) { emit('activate', name) }

const idCol = (props.readModel.columns.find((c) => c.identity) || props.readModel.columns[0])?.name

// The selected row's lifecycle, when this read model carries a state machine.
const selectedRow = computed(() => props.rows.find((r) => r[idCol] === props.selectedId))
const lifecycle = computed(() => {
  const sm = props.readModel.stateMachine
  if (!sm || !selectedRow.value) return null
  return { sm, current: selectedRow.value[sm.statusColumn] }
})

function truthy(v) {
  return v === true || v === 't' || v === 'true' || v === 1 || v === '1'
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="px-4 py-2 border-b border-slate-100 text-sm font-medium text-slate-700 flex items-center gap-2">
      {{ readModel.name }}
      <span class="text-slate-300 text-xs">({{ rows.length }})</span>
    </div>
    <table class="w-full text-sm">
      <thead>
        <tr class="text-left text-slate-400 text-xs">
          <th v-for="c in readModel.columns" :key="c.name" class="px-3 py-1.5 font-medium">{{ c.name }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!rows.length"><td :colspan="readModel.columns.length" class="px-3 py-3 text-slate-400 text-xs">no rows yet</td></tr>
        <tr
          v-for="row in rows"
          :key="row[idCol]"
          :class="['border-t border-slate-50 cursor-pointer', row[idCol] === selectedId ? 'bg-sky-100 ring-1 ring-inset ring-sky-300' : 'hover:bg-sky-50']"
          @click="emit('select', row[idCol])"
        >
          <td v-for="c in readModel.columns" :key="c.name" class="px-3 py-1.5 align-top">
            <template v-if="c.type === 'boolean'">
              <font-awesome-icon v-if="truthy(row[c.name])" :icon="['fas', 'check']" class="text-emerald-600" />
              <font-awesome-icon v-else :icon="['fas', 'xmark']" class="text-slate-300" />
            </template>
            <span v-else-if="c.identity" class="font-mono text-xs text-slate-500">{{ String(row[c.name]).slice(0, 8) }}…</span>
            <span v-else>{{ row[c.name] }}</span>
          </td>
        </tr>
      </tbody>
    </table>
    <StateMachineView v-if="lifecycle" :sm="lifecycle.sm" :current="lifecycle.current" @activate="onActivate" />
    <p class="px-3 py-1.5 text-[11px] text-slate-400">click a row to select its id for commands</p>
  </div>
</template>