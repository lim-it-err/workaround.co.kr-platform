<script setup>
import { computed, defineAsyncComponent, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { platformHomePath } from './platformNavigation.js'
import { routeLoading } from './router.js'
import { learnerNickname } from '../modules/missions/store/learnerIdentity.js'

const NicknamePrompt = defineAsyncComponent(
  () => import('../modules/missions/components/NicknamePrompt.vue'),
)

const platformHome = platformHomePath(import.meta.env.BASE_URL)
const router = useRouter()
const route = useRoute()
const learnIsCurrent = computed(() => route.path === '/learn' || route.path === '/courses' || route.path.startsWith('/courses/'))
function exitAdvisor() {
  if (platformHome) window.location.assign(platformHome)
  else router.push('/today')
}

const nickname = computed(() => learnerNickname.value)

const showNicknamePrompt = ref(false)

function openNicknamePrompt() {
  showNicknamePrompt.value = true
}

function onNicknameConfirmed() {
  showNicknamePrompt.value = false
}

function onNicknameCancelled() {
  showNicknamePrompt.value = false
}
</script>

<template>
  <div class="app-shell">
    <div class="portal-stage line-d">
      <header class="station-topbar">
        <span class="roundel" aria-hidden="true">A</span>
        <h2>Developer Advisor</h2>
        <div class="topbar-actions">
          <button v-if="nickname" type="button" class="ghost-button nickname-chip" title="닉네임 변경" @click="openNicknamePrompt">{{ nickname }}</button>
          <button
            type="button"
            class="ghost-button exit-button"
            :aria-label="platformHome ? '환승 홀로 나가기' : '오늘로'"
            @click="exitAdvisor"
          >{{ platformHome ? '환승 홀' : '오늘' }}</button>
        </div>
      </header>
      <nav class="nav" aria-label="전역 메뉴">
        <router-link to="/today" class="nav-link">오늘</router-link>
        <router-link
          to="/learn"
          class="nav-link"
          :class="{ current: learnIsCurrent }"
          :aria-current="learnIsCurrent ? 'page' : undefined"
        >배우기</router-link>
        <router-link to="/history" class="nav-link">기록</router-link>
      </nav>
      <main class="shell-main page-scroller">
        <p v-if="routeLoading" class="route-loading" role="status" aria-live="polite">불러오는 중</p>
        <router-view />
      </main>
      <footer class="shell-footer">
        학습 기록은 이 브라우저에 우선 저장됩니다
      </footer>
    </div>

    <NicknamePrompt
      v-if="showNicknamePrompt"
      :initial="nickname"
      @confirmed="onNicknameConfirmed"
      @cancelled="onNicknameCancelled"
    />
  </div>
</template>

<style scoped>
.nav {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  border-bottom: 1px solid var(--line);
}
.nickname-chip {
  max-width: 6em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nav-link {
  color: var(--fg-dim);
  text-decoration: none;
  font-size: .875rem;
  padding: 8px 12px;
  border-bottom: 3px solid transparent;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  justify-content: center;
  flex: 1 1 0;
}
.nav-link:hover {
  color: var(--accent-text);
}
.nav-link.router-link-active, .nav-link.current {
  color: var(--accent-text);
  border-bottom-color: var(--accent);
  font-weight: 600;
}
.shell-main {
  width: 100%;
  min-width: 0;
  padding: 8px 4px 8px 0;
}
.route-loading {
  margin: 0 0 8px;
  padding-bottom: 7px;
  border-bottom: 1px solid var(--accent);
  color: var(--fg-dim);
  font-size: 12px;
}
.shell-footer {
  padding-top: 12px;
  border-top: 1px solid var(--line);
  color: var(--fg-dim);
  font-size: .75rem;
}
@media (max-width: 760px) {
  .nav { gap: 2px; }
  .nav-link { padding-inline: 10px; }
}
</style>
