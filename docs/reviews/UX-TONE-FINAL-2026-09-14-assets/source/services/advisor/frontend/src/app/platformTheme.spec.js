import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h } from 'vue'
import { readFileSync } from 'node:fs'
import { URL as FileURL } from 'node:url'
import { normalizeTheme, readTheme, THEME_STORAGE_KEY, usePlatformTheme } from './platformTheme.js'

let app
afterEach(() => {
  app?.unmount()
  vi.restoreAllMocks()
  localStorage.clear()
  document.body.innerHTML = ''
  delete document.documentElement.dataset.theme
})

function mountTheme() {
  let state
  const host = document.createElement('div')
  document.body.append(host)
  app = createApp({ setup() { state = usePlatformTheme(); return () => h('div') } })
  app.mount(host)
  return state
}

describe('platform theme bridge', () => {
  it('defaults to dark and only accepts the platform theme values', () => {
    expect(readTheme()).toBe('dark')
    expect(normalizeTheme('light')).toBe('light')
    expect(normalizeTheme('invalid')).toBe('dark')
  })
  it('restores the shared setting, toggles and survives remount', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    const state = mountTheme()
    expect(document.documentElement.dataset.theme).toBe('light')
    state.toggleTheme()
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    app.unmount()
    expect(mountTheme().theme.value).toBe('dark')
  })
  it('updates immediately when another same-origin tab changes or clears storage', () => {
    const state = mountTheme()
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY }))
    expect(state.theme.value).toBe('light')
    localStorage.clear()
    window.dispatchEvent(new StorageEvent('storage', { key: null }))
    expect(state.theme.value).toBe('dark')
  })
  it('keeps the toggle usable when local storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    const state = mountTheme()
    expect(() => state.toggleTheme()).not.toThrow()
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})

it('keeps the adapter aligned with the motherframe tokens in both themes', () => {
  const mother = readFileSync(new FileURL('../../../../../frontend/src/styles.css', import.meta.url), 'utf8')
  const adapter = readFileSync(new FileURL('./platform.css', import.meta.url), 'utf8')
  function tokens(css, selector) {
    const result = {}
    for (const block of css.matchAll(selector)) {
      for (const [, name, value] of block[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)) result[name] = value.replace(/\s+/g, '')
    }
    return result
  }
  for (const [from, to] of [
    [/:root\s*\{([^}]+)\}/g, /:root\s*\{([^}]+)\}/g],
    [/\.app-shell\[data-theme='light'\]\s*\{([^}]+)\}/g, /:root\[data-theme='light'\]\s*\{([^}]+)\}/g],
  ]) {
    const expected = tokens(mother, from)
    const actual = tokens(adapter, to)
    const shared = Object.keys(actual).filter(key => key in expected && key !== '--border')
    expect(shared.length).toBeGreaterThan(20)
    for (const key of shared) expect(actual[key], key).toBe(expected[key])
  }
})
