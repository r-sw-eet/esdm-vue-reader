// All requests go to the connected app's base URL (0004 contract surface).
let base = ''

export function setBase(url) {
  base = String(url || '').replace(/\/+$/, '')
}

export function apiUrl(path) {
  return base + path
}

export async function postCommand(path, body) {
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

export async function getJson(path) {
  try {
    const res = await fetch(apiUrl(path))
    if (!res.ok) return null
    return await res.json().catch(() => null)
  } catch {
    return null
  }
}

export async function getText(path) {
  try {
    const res = await fetch(apiUrl(path))
    if (!res.ok) return ''
    return await res.text()
  } catch {
    return ''
  }
}
