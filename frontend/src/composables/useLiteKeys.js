import { onBeforeUnmount, onMounted, ref } from 'vue'

// TKT-228: lite 화면 공용 키 규칙 (TKT-227 HallLite 규칙을 그대로 옮김).
// ↑↓ = onMove(∓1), ←→ = onSide(∓1), Enter = onEnter, Esc = onBack, Home/End = onHome/onEnd.
// 입력 칸·select·contenteditable 와 Alt/Ctrl/Meta 조합은 무시, Enter 는 button·a[href]·summary 위에서 원래 동작.
// 콜백이 없으면 그 키는 무시(preventDefault 하지 않음). onEnter 가 false 를 돌려주면 처리하지 않은 것으로 본다.
// 포인터는 「한 번 = 선택, 같은 줄 다시 = 진입」: pointerPick(index, { current, select, enter }).
function isTypingTarget(target) {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])'))
}

export function useLiteKeys(handlers = {}) {
  const armed = ref(false) // 마우스·터치로 고른 줄만 true

  function onKeydown(event) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
    if (isTypingTarget(event.target)) return
    const key = event.key
    let handled = false
    if (key === 'Enter') {
      if (event.target instanceof Element && event.target.closest('button, a[href], summary')) return
      if (handlers.onEnter && handlers.onEnter() !== false) handled = true
    } else if (key === 'ArrowDown' && handlers.onMove) {
      armed.value = false
      handlers.onMove(1)
      handled = true
    } else if (key === 'ArrowUp' && handlers.onMove) {
      armed.value = false
      handlers.onMove(-1)
      handled = true
    } else if (key === 'ArrowRight' && handlers.onSide) {
      armed.value = false
      handlers.onSide(1)
      handled = true
    } else if (key === 'ArrowLeft' && handlers.onSide) {
      armed.value = false
      handlers.onSide(-1)
      handled = true
    } else if (key === 'Escape' && handlers.onBack) {
      handlers.onBack()
      handled = true
    } else if (key === 'Home' && handlers.onHome) {
      armed.value = false
      handlers.onHome()
      handled = true
    } else if (key === 'End' && handlers.onEnd) {
      armed.value = false
      handlers.onEnd()
      handled = true
    }
    if (!handled) return
    event.preventDefault()
    handlers.onHandled?.(event)
  }

  function pointerPick(index, { current, select, enter }) {
    if (index === current && armed.value) {
      enter(index)
    } else {
      select(index)
      armed.value = true
    }
  }

  onMounted(() => document.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

  return { armed, pointerPick }
}
