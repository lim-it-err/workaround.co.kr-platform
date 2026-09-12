import { onMounted, onUnmounted, ref, watch } from 'vue'

export const THEME_STORAGE_KEY = 'workaround-theme'
export const normalizeTheme = value => value === 'light' ? 'light' : 'dark'

export function readTheme() {
  try { return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY)) }
  catch { return 'dark' }
}

export function usePlatformTheme() {
  const theme = ref(readTheme())
  watch(theme, value => {
    document.documentElement.dataset.theme = value
  }, { immediate: true, flush: 'sync' })
  const sync = event => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) theme.value = readTheme()
  }
  onMounted(() => window.addEventListener('storage', sync))
  onUnmounted(() => window.removeEventListener('storage', sync))
  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    try { window.localStorage.setItem(THEME_STORAGE_KEY, theme.value) } catch { /* session-only theme */ }
  }
  return { theme, toggleTheme }
}
