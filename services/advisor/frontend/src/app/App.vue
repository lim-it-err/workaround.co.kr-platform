<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import StationHeader from '../../../../../frontend/src/components/StationHeader.vue'
import { useMissions } from '../modules/missions/store/missions.js'
import NicknamePrompt from '../modules/missions/components/NicknamePrompt.vue'
import { platformHomePath } from './platformNavigation.js'
import { usePlatformTheme } from './platformTheme.js'

const platformHome = platformHomePath(import.meta.env.BASE_URL)
const router = useRouter()
const { theme, toggleTheme } = usePlatformTheme()
function exitAdvisor() {
  if (platformHome) window.location.assign(platformHome)
  else router.push('/missions')
}

const store = useMissions()
const nickname = computed(() => store.state.learner.nickname)

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
        title="Developer Advisor"
        :prev-label="platformHome ? '← 환승 홀' : '← 미션 목록'"
        :exit-label="platformHome ? '환승 홀로 나가기' : '미션 목록으로'"
        next-label=""
        @exit="exitAdvisor"
      >
        <template #actions>
          <button type="button" class="btn theme-toggle" @click="toggleTheme">{{ theme === 'dark' ? '밝게 보기' : '어둡게 보기' }}</button>
          <button v-if="nickname" type="button" class="btn nickname-chip" title="닉네임 변경" @click="openNicknamePrompt">👤 {{ nickname }}</button>
        </template>
      </StationHeader>
      <nav class="nav" aria-label="Advisor 메뉴">
        <router-link to="/missions" class="nav-link" exact-active-class="current">미션 목록</router-link>
        <router-link to="/routine" class="nav-link">오늘의 훈련</router-link>
        <router-link to="/inflight" class="nav-link">기내 모드</router-link>
        <router-link to="/season" class="nav-link">시즌</router-link>
        <router-link to="/games" class="nav-link">미니게임</router-link>
        <router-link to="/projects" class="nav-link">프로젝트</router-link>
        <router-link to="/missions/history" class="nav-link">성장 기록</router-link>
      </nav>
    </header>
    <main class="shell-main">
      <router-view />
    </main>
    <footer class="shell-footer">
      prototype v0.1 — 콘텐츠는 에이전트 생성 샘플입니다
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
  flex-wrap: wrap;
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
}
.nav-link:hover {
  color: var(--accent-text);
}
.nav-link.router-link-exact-active, .nav-link.current {
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
