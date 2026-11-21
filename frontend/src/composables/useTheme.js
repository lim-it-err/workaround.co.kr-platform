import { ref, watch } from 'vue'

// TKT-218 (D-035 보완·D-036): 라이트 테마를 없애고 보기 전환(기본 / lite)만 둔다.
// 구 키 `workaround-theme` 는 읽지도 쓰지도 않는다 — 저장값이 light 여도 검은 화면으로 열린다.
const VIEW_STORAGE_KEY = 'workaround-view'

function readQueryView() {
  try {
    return new URLSearchParams(window.location.search).get('view') === 'lite' ? 'lite' : null
  } catch (error) {
    return null
  }
}

function readStoredView() {
  try {
    return window.localStorage.getItem(VIEW_STORAGE_KEY) === 'lite' ? 'lite' : 'base'
  } catch (error) {
    return 'base'
  }
}

export function useView() {
  const queryView = typeof window === 'undefined' ? null : readQueryView()
  const view = ref(queryView || (typeof window === 'undefined' ? 'base' : readStoredView()))
  // ?view=lite 로 연 경우 저장값은 사용자가 직접 토글하기 전까지 건드리지 않는다.
  let persist = !queryView

  watch(view, (nextView) => {
    if (!persist || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, nextView)
    } catch (error) {
      // 저장 실패는 현재 화면 사용을 막지 않는다.
    }
  })

  function setView(nextView) {
    persist = true
    view.value = nextView === 'lite' ? 'lite' : 'base'
  }

  return { view, setView }
}
