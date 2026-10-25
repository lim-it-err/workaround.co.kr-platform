import { ref, watch } from 'vue'

// TKT-211: App.vue 에서 떼어낸 테마(다크/라이트) 상태. 저장 키·기본값은 그대로다.
const THEME_STORAGE_KEY = 'workaround-theme'

function readInitialTheme() {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
  } catch (error) {
    return 'dark'
  }

  return 'dark'
}

export function useTheme() {
  const theme = ref(readInitialTheme())

  watch(theme, (nextTheme) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
      } catch (error) {
        // 테마 저장 실패는 현재 화면 사용을 막지 않는다.
      }
    }
  })

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, toggleTheme }
}
