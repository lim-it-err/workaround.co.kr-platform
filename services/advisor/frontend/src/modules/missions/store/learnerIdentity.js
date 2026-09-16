import { ref } from 'vue'

const STORAGE_KEY = 'advisor.learner.v1'

function readNickname() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY))?.learner?.nickname ?? ''
  } catch {
    return ''
  }
}

export const learnerNickname = ref(readNickname())

export function syncLearnerNickname(value) {
  learnerNickname.value = String(value ?? '').trim().slice(0, 12)
}
