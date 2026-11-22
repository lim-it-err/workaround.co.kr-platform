import LiteVoyage from './LiteVoyage.vue'
import LiteEts2 from './LiteEts2.vue'
import LitePantry from './LitePantry.vue'
import LiteWork from './LiteWork.vue'

// TKT-228: 페이지 id → lite 컴포넌트. 여기 없는 페이지(Advisor·격납고·블로그 등)는 lite 에서도 기본 화면.
export const LITE_PAGES = {
  voyage: LiteVoyage,
  ets2: LiteEts2,
  pantry: LitePantry,
  work: LiteWork
}
