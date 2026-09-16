<script setup>
import { computed, defineAsyncComponent, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StationHeader from '../../../../../frontend/src/components/StationHeader.vue'
import { platformHomePath } from './platformNavigation.js'
import { usePlatformTheme } from './platformTheme.js'
import { routeLoading } from './router.js'
import { learnerNickname } from '../modules/missions/store/learnerIdentity.js'

const NicknamePrompt = defineAsyncComponent(
  () => import('../modules/missions/components/NicknamePrompt.vue'),
)

const platformHome = platformHomePath(import.meta.env.BASE_URL)
const router = useRouter()
const route = useRoute()
const { theme, toggleTheme } = usePlatformTheme()
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
  <div class="shell" :data-theme="theme">
    <header class="shell-header">
      <StationHeader
        line-class="line-a"
        station-code="A"
        title="개발자 어드바이저"
        :prev-label="platformHome ? '← 환승 홀' : '← 오늘'"
        :exit-label="platformHome ? '환승 홀로 나가기' : '오늘로'"
        next-label=""
        @exit="exitAdvisor"
      >
        <template #actions>
          <button type="button" class="btn theme-toggle" @click="toggleTheme">{{ theme === 'dark' ? '밝게 보기' : '어둡게 보기' }}</button>
          <button v-if="nickname" type="button" class="btn nickname-chip" title="닉네임 변경" @click="openNicknamePrompt">👤 {{ nickname }}</button>
        </template>
      </StationHeader>
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
    </header>
    <main class="shell-main">
      <p v-if="routeLoading" class="route-loading" role="status" aria-live="polite">불러오는 중</p>
      <router-view />
    </main>
    <footer class="shell-footer">
      학습 기록은 이 브라우저에 우선 저장됩니다
    </footer>

    <NicknamePrompt
      v-if="showNicknamePrompt"
      :initial="nickname"
      @confirmed="onNicknameConfirmed"
      @cancelled="onNicknameCancelled"
    />
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.shell-header {
  width: 100%;
  max-width: 1060px;
  margin: 0 auto;
  padding: 18px 28px 0;
}
.nav {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  margin-top: 14px;
  border-bottom: 1px solid var(--line);
}
.nickname-chip {
  max-width: 100%;
  overflow-wrap: anywhere;
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
  flex: 1;
  width: 100%;
  max-width: 1060px;
  margin: 0 auto;
  padding: 28px;
  box-sizing: border-box;
}
.route-loading {
  margin: 0 0 8px;
  padding-bottom: 7px;
  border-bottom: 1px solid var(--accent);
  color: var(--fg-dim);
  font-size: 12px;
}
.shell-footer {
  padding: 14px 28px;
  border-top: 1px solid var(--border);
  color: var(--fg-dim);
  font-size: .75rem;
}

@media (max-width: 760px) {
  .shell-header {
    padding: 14px 16px 0;
  }
  .nav { gap: 2px; }
  .nav-link { padding-inline: 10px; }
  .shell-main {
    padding: 16px;
  }
  .shell-footer {
    padding: 12px 16px;
  }
}
</style>
