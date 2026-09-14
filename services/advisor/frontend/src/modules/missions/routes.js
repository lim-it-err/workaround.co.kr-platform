// missions 모듈의 라우트 정의.
// platform frontend로 이식할 때 이 배열을 그쪽 라우터에 spread 하면 된다.
export const missionRoutes = [
  {
    path: '/today',
    name: 'today',
    component: () => import('./pages/TodayPage.vue'),
  },
  {
    path: '/learn',
    name: 'learn',
    component: () => import('./pages/LearnPage.vue'),
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('./pages/RecordsPage.vue'),
  },
  {
    path: '/routine',
    redirect: (to) => ({ path: '/today', query: to.query, hash: to.hash }),
  },
  {
    path: '/inflight',
    redirect: (to) => ({ path: '/today', query: to.query, hash: '#offline' }),
  },
  {
    path: '/missions',
    redirect: (to) => ({ path: '/learn', query: to.query, hash: to.hash }),
  },
  {
    path: '/games',
    redirect: (to) => ({ path: '/learn', query: to.query, hash: '#practice' }),
  },
  {
    path: '/projects',
    redirect: (to) => ({ path: '/learn', query: to.query, hash: '#projects' }),
  },
  {
    path: '/missions/history',
    redirect: (to) => ({ path: '/history', query: to.query, hash: to.hash }),
  },
  {
    path: '/season',
    redirect: (to) => ({ path: '/history', query: to.query, hash: '#season' }),
  },
  {
    path: '/games/practice/:gameId/:roundId?',
    name: 'practice-game',
    component: () => import('./pages/PracticeGamePage.vue'),
  },
  {
    path: '/games/probe',
    name: 'probe-game',
    component: () => import('./pages/ProbeGamePage.vue'),
  },
  {
    path: '/games/boundary',
    name: 'boundary-game',
    component: () => import('./pages/BoundaryGamePage.vue'),
  },
  {
    path: '/games/case/:caseId',
    name: 'case-file',
    component: () => import('./pages/CaseFilePage.vue'),
  },
  {
    path: '/routine/swipe',
    name: 'swipe-review-game',
    component: () => import('./pages/SwipeReviewPage.vue'),
  },
  {
    path: '/missions/:id',
    name: 'mission-detail',
    component: () => import('./pages/MissionPage.vue'),
  },
  {
    path: '/missions/:id/review',
    name: 'mission-review',
    component: () => import('./pages/ReviewPage.vue'),
  },
  {
    path: '/projects/:id',
    name: 'project-journey',
    component: () => import('./pages/ProjectJourneyPage.vue'),
  },
]
