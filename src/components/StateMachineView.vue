<script setup>
import { computed } from 'vue'

const props = defineProps({ sm: Object, current: String })
const emit = defineEmits(['activate'])

function pick(command) { emit('activate', command) }

const admits = computed(() => props.sm.admits || [])
const available = computed(() => admits.value.filter((a) => (a.from || []).includes(props.current)))
const blocked = computed(() => admits.value.filter((a) => !(a.from || []).includes(props.current)))
const isFinal = computed(() => (props.sm.states || []).some((s) => s.name === props.current && s.final))
</script>

<template>
  <div class="border-t border-slate-100 bg-slate-50/60 px-3 py-2.5">
    <div class="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">lifecycle</div>
    <div class="flex items-center flex-wrap gap-1">
      <template v-for="(s, i) in sm.states" :key="s.name">
        <span
          class="px-2 py-0.5 rounded text-xs flex items-center gap-1"
          :class="s.name === current ? 'bg-sky-600 text-white font-medium' : 'bg-white border border-slate-200 text-slate-500'"
        >
          {{ s.name }}
          <font-awesome-icon v-if="s.final" :icon="['fas', 'flag-checkered']" class="opacity-60" />
        </span>
        <font-awesome-icon v-if="i < sm.states.length - 1" :icon="['fas', 'arrow-right']" class="text-slate-300 text-[10px]" />
      </template>
    </div>
    <div class="mt-2 text-xs flex flex-wrap items-center gap-1.5">
      <span class="text-slate-400">next:</span>
      <span v-if="isFinal" class="text-slate-400 italic">— final state</span>
      <button
        v-for="a in available"
        :key="a.command"
        type="button"
        :data-next="a.command"
        class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200 cursor-pointer"
        @click="pick(a.command)"
      >
        {{ a.command }}<span v-if="a.to"> → {{ a.to }}</span><span v-if="a.when" class="opacity-60"> · {{ a.when }}</span>
      </button>
      <span
        v-for="a in blocked"
        :key="'b-' + a.command"
        class="px-2 py-0.5 rounded bg-slate-100 text-slate-400 border border-slate-200 line-through"
      >
        {{ a.command }}
      </span>
    </div>
  </div>
</template>