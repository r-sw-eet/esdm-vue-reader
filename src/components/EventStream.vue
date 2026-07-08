<script setup>
import { computed } from 'vue'

const props = defineProps({ events: Array, filterId: String })
const emit = defineEmits(['clear', 'select'])

const shown = computed(() =>
  props.filterId ? props.events.filter((e) => e.aggregate_id === props.filterId) : props.events,
)

// playhead is null on stores without a per-aggregate sequence (0004 §4).
function hasPlayhead(e) {
  return e.playhead !== null && e.playhead !== undefined
}
</script>

<template>
  <div class="space-y-2">
    <button
      v-if="filterId"
      type="button"
      class="w-full flex items-center gap-2 bg-amber-100 border border-amber-300 text-amber-800 rounded-lg px-3 py-1.5 text-xs hover:bg-amber-200"
      @click="emit('clear')"
    >
      <font-awesome-icon :icon="['fas', 'circle-info']" />
      <span>filtered by <span class="font-mono">{{ String(filterId).slice(0, 8) }}…</span></span>
      <span class="ml-auto flex items-center gap-1">clear <font-awesome-icon :icon="['fas', 'xmark']" /></span>
    </button>
    <p v-if="!shown.length" class="text-slate-400 text-xs">{{ filterId ? 'no events for this id' : 'no events yet — send a command' }}</p>
    <div v-for="e in shown" :key="e.id" class="bg-white rounded-lg border border-slate-200 p-3 text-sm">
      <div class="flex items-center gap-2">
        <font-awesome-icon :icon="['fas', 'bolt']" class="text-amber-500" />
        <span class="font-mono text-xs text-slate-800">{{ e.event }}</span>
        <span class="ml-auto text-[11px] text-slate-400">#{{ e.id }}<template v-if="hasPlayhead(e)"> · pos {{ e.playhead }}</template></span>
      </div>
      <button
        type="button"
        class="text-[11px] mt-1 font-mono hover:underline"
        :class="e.aggregate_id === filterId
          ? 'text-amber-800 bg-amber-100 px-1 rounded'
          : 'text-slate-500 hover:text-sky-600'"
        title="use this id in commands"
        @click="emit('select', e.aggregate_id)"
      >{{ String(e.aggregate_id).slice(0, 8) }}…</button>
      <pre class="mt-2 bg-slate-50 rounded p-2 text-[11px] text-slate-600 overflow-x-auto">{{ JSON.stringify(e.payload, null, 2) }}</pre>
    </div>
  </div>
</template>
