<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, nextTick } from 'vue'
import CommandCard from './components/CommandCard.vue'
import ReadModelTable from './components/ReadModelTable.vue'
import EventStream from './components/EventStream.vue'
import BpmnEditor from './components/BpmnEditor.vue'
import { getJson, getText, setBase } from './api.js'

const STORAGE_KEY = 'esdm-vue-reader.app-url'

// Connection state: the viewer is stack-agnostic and learns everything it
// renders from the target app's 0004 contract (/_dev/catalog, /_dev/bpmn).
const appUrl = ref('')
const draftUrl = ref('')
const catalog = ref(null)
const bpmnSource = ref('')
const connectError = ref('')
const connecting = ref(false)

const view = ref('console')
const selectedId = ref('')
const filterId = ref('')
const rows = reactive({})
const events = ref([])
const toast = ref(null)
let timer = null

const readModels = computed(() =>
  catalog.value ? catalog.value.contexts.flatMap((c) => c.readModels) : [],
)

// Command accordion: each command is a text row that expands its form.
const open = ref('')
function toggle(key) { open.value = open.value === key ? '' : key }

function initialUrl() {
  const fromQuery = new URLSearchParams(window.location.search).get('app')
  return fromQuery || localStorage.getItem(STORAGE_KEY) || import.meta.env.VITE_APP_URL || ''
}

async function connect(url) {
  const target = String(url || '').trim().replace(/\/+$/, '')
  if (!target) return
  connecting.value = true
  connectError.value = ''
  setBase(target)
  const cat = await getJson('/_dev/catalog')
  if (!cat || !Array.isArray(cat.contexts)) {
    connecting.value = false
    connectError.value = `No catalog at ${target}/_dev/catalog — is the app running, and does it expose the domain-console contract (proposal 0004)?`
    return
  }
  catalog.value = cat
  appUrl.value = target
  draftUrl.value = target
  localStorage.setItem(STORAGE_KEY, target)
  bpmnSource.value = await getText('/_dev/bpmn')
  connecting.value = false
  stopPolling()
  await refresh()
  timer = setInterval(refresh, 1500)
}

function disconnect() {
  stopPolling()
  catalog.value = null
  appUrl.value = ''
  bpmnSource.value = ''
  events.value = []
  for (const k of Object.keys(rows)) delete rows[k]
  selectedId.value = ''
  filterId.value = ''
  view.value = 'console'
}

function stopPolling() {
  if (timer) { clearInterval(timer); timer = null }
}

async function refresh() {
  if (!catalog.value) return
  for (const rm of readModels.value) {
    if (rm.listPath) rows[rm.name] = (await getJson(rm.listPath)) || []
  }
  events.value = (await getJson('/_dev/events')) || []
}

function notify(msg, ok = true) {
  toast.value = { msg, ok }
  setTimeout(() => { toast.value = null }, 2600)
}

function onResult(r) {
  if (r.ok) notify(`${r.command.name} → ${r.data.id ? 'id ' + r.data.id.slice(0, 8) + '…' : 'ok'}`)
  else notify(`${r.command.name}: ${r.data.error || 'failed (' + r.status + ')'}`, false)
  refresh()
}

function onSelect(id) {
  selectedId.value = id
  filterId.value = id
  notify('filtering events by ' + String(id).slice(0, 8) + '…')
}

function clearFilter() {
  filterId.value = ''
}

// A "next" lifecycle chip was clicked — open that command's form and scroll to it.
function onActivateCommand(name) {
  for (const ctx of catalog.value.contexts) {
    const cmd = ctx.commands.find((c) => c.name === name)
    if (!cmd) continue
    open.value = ctx.name + '/' + cmd.name
    nextTick(() => {
      const el = document.getElementById('cmd-' + ctx.name + '-' + cmd.name)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    return
  }
}

onMounted(() => {
  draftUrl.value = initialUrl()
  if (draftUrl.value) connect(draftUrl.value)
})
onUnmounted(stopPolling)
</script>

<template>
  <header class="bg-slate-900 text-white">
    <div class="max-w-[1600px] mx-auto px-6 py-5">
      <h1 class="text-xl font-semibold capitalize flex items-center gap-2">
        <img src="/favicon.svg" alt="" class="h-9 w-9 -my-1" />
        {{ catalog ? catalog.domain + ' · domain console' : 'ESDM-Vue-Reader · Domain Console' }}
      </h1>
      <p class="text-slate-300 text-sm mt-1">
        Send a <b>command</b> (left) → it becomes an <b>event</b> (right) → the projections update the
        <b>read models</b> (center). For verifying behavior before building end-user UI.
      </p>
      <div v-if="catalog" class="mt-3 flex items-center gap-1">
        <button
          type="button"
          @click="view = 'console'"
          :class="['px-3 py-1.5 rounded-md text-sm flex items-center gap-2', view === 'console' ? 'bg-white text-slate-900 font-medium' : 'bg-slate-800 text-slate-300 hover:bg-slate-700']"
        >
          <font-awesome-icon :icon="['fas', 'table-list']" /> Domain console
        </button>
        <button
          type="button"
          @click="view = 'author'"
          :class="['px-3 py-1.5 rounded-md text-sm flex items-center gap-2', view === 'author' ? 'bg-white text-slate-900 font-medium' : 'bg-slate-800 text-slate-300 hover:bg-slate-700']"
        >
          <font-awesome-icon :icon="['fas', 'sitemap']" /> Author (BPMN)
        </button>
        <button
          type="button"
          @click="disconnect"
          class="ml-auto px-3 py-1.5 rounded-md text-sm flex items-center gap-2 bg-slate-800 text-slate-300 hover:bg-slate-700"
          :title="'connected to ' + appUrl"
        >
          <font-awesome-icon :icon="['fas', 'plug']" class="text-emerald-400" />
          <span class="font-mono text-xs">{{ appUrl }}</span>
          <font-awesome-icon :icon="['fas', 'xmark']" />
        </button>
      </div>
    </div>
  </header>

  <main v-if="!catalog" class="max-w-xl mx-auto px-6 py-16">
    <form
      @submit.prevent="connect(draftUrl)"
      class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4"
    >
      <h2 class="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <font-awesome-icon :icon="['fas', 'plug']" class="text-sky-600" /> Connect to a generated app
      </h2>
      <p class="text-xs text-slate-500">
        Point the viewer at any app that exposes the <b>domain-console contract</b> (esdm-extensions
        proposal 0004): commands, read models and the event stream all come from the app itself.
      </p>
      <p class="text-xs text-slate-500">
        No app yet? Generate one from an ESDM model with
        <a href="https://github.com/r-sw-eet/esdm-2-nimbus" target="_blank" rel="noopener"
           class="text-sky-600 font-medium hover:underline">esdm-2-nimbus</a>
        (TypeScript · Nimbus) or
        <a href="https://github.com/r-sw-eet/esdm-2-symfony" target="_blank" rel="noopener"
           class="text-sky-600 font-medium hover:underline">esdm-2-symfony</a>
        (PHP · Symfony), then point the viewer at it.
      </p>
      <input
        v-model="draftUrl"
        type="text"
        placeholder="http://localhost:8080"
        class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-400"
      />
      <button
        :disabled="connecting"
        class="w-full rounded-md bg-slate-900 text-white text-sm py-2 hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <font-awesome-icon :icon="['fas', connecting ? 'rotate' : 'plug']" :class="connecting ? 'animate-spin' : ''" />
        {{ connecting ? 'Connecting…' : 'Connect' }}
      </button>
      <p v-if="connectError" class="text-xs text-rose-600">{{ connectError }}</p>
      <p class="text-[11px] text-slate-400">
        Tip: pass <span class="font-mono">?app=http://localhost:8080</span> in the URL, or set
        <span class="font-mono">VITE_APP_URL</span>.
      </p>
    </form>
  </main>

  <main v-if="catalog && view === 'author'" class="max-w-[1600px] mx-auto px-6 py-6">
    <BpmnEditor :source="bpmnSource" />
  </main>

  <main v-if="catalog && view === 'console'" class="max-w-[1600px] mx-auto px-6 py-6 grid grid-cols-12 gap-6 items-start">
    <section class="col-span-12 lg:col-span-3">
      <h2 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
        <font-awesome-icon :icon="['fas', 'paper-plane']" /> Send a command
      </h2>
      <div class="space-y-4">
        <div v-for="ctx in catalog.contexts" :key="ctx.name">
          <h3 class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <font-awesome-icon :icon="['fas', 'diagram-project']" class="text-slate-300" /> {{ ctx.name }}
          </h3>
          <div class="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            <div v-for="cmd in ctx.commands" :key="cmd.name" :id="'cmd-' + ctx.name + '-' + cmd.name">
              <button
                type="button"
                class="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
                @click="toggle(ctx.name + '/' + cmd.name)"
              >
                <font-awesome-icon
                  :icon="['fas', cmd.lifecycle === 'create' ? 'plus' : cmd.lifecycle === 'delete' ? 'trash' : 'pen']"
                  :class="cmd.lifecycle === 'create' ? 'text-emerald-600' : cmd.lifecycle === 'delete' ? 'text-rose-600' : 'text-sky-600'"
                />
                <span class="text-slate-700">{{ cmd.name }}</span>
                <span class="ml-auto text-[10px] uppercase tracking-wide text-slate-300">{{ cmd.lifecycle }}</span>
                <font-awesome-icon
                  :icon="['fas', open === ctx.name + '/' + cmd.name ? 'chevron-down' : 'chevron-right']"
                  class="text-slate-400"
                />
              </button>
              <div v-if="cmd.guard" class="px-3 pb-1.5 -mt-0.5 text-[10px] text-slate-400 flex items-start gap-1">
                <font-awesome-icon :icon="['fas', 'lock']" class="text-slate-300 mt-0.5" />
                <span>from {{ (cmd.guard.from || []).join(', ') || 'any' }}<span v-if="cmd.guard.when"> · {{ cmd.guard.when }}</span></span>
              </div>
              <div v-if="open === ctx.name + '/' + cmd.name" class="px-3 pb-3 pt-1 bg-slate-50/60">
                <CommandCard :command="cmd" :selected-id="selectedId" :embedded="true" @result="onResult" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="col-span-12 lg:col-span-6">
      <h2 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
        <font-awesome-icon :icon="['fas', 'table-list']" /> Read models
        <font-awesome-icon :icon="['fas', 'rotate']" class="text-slate-300 ml-1 animate-spin" />
      </h2>
      <div class="space-y-4">
        <template v-for="ctx in catalog.contexts" :key="ctx.name">
          <ReadModelTable
            v-for="rm in ctx.readModels"
            :key="rm.name"
            :read-model="rm"
            :rows="rows[rm.name] || []"
            :selected-id="selectedId"
            @select="onSelect"
            @activate="onActivateCommand"
          />
        </template>
      </div>
    </section>

    <section class="col-span-12 lg:col-span-3">
      <h2 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
        <font-awesome-icon :icon="['fas', 'bolt']" /> Event stream
      </h2>
      <EventStream :events="events" :filter-id="filterId" @clear="clearFilter" @select="onSelect" />
    </section>
  </main>

  <transition>
    <div
      v-if="toast"
      class="fixed bottom-5 right-5 px-4 py-2 rounded-lg shadow-lg text-white text-sm"
      :class="toast.ok ? 'bg-emerald-600' : 'bg-rose-600'"
    >
      {{ toast.msg }}
    </div>
  </transition>
</template>
