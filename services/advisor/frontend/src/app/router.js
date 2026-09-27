import { ref } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { missionRoutes } from '../modules/missions/routes.js'

export const routeLoading = ref(false)

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, top: 16 }
    return { top: 0 }
  },
  routes: [
    { path: '/', redirect: '/today' },
    ...missionRoutes,
  ],
})

router.beforeEach(() => {
  routeLoading.value = true
})
router.afterEach(() => {
  routeLoading.value = false
})
router.onError(() => {
  routeLoading.value = false
})
