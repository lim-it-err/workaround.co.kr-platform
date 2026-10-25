import assert from 'node:assert/strict'
import { test } from 'node:test'
import { FIXED_SPLASH_TICKER, SPLASH_TICKER_POOL } from './splashTicker.js'

test('고정 문구는 원문 문자열이고 풀(SPLASH_TICKER_POOL)에 들어 있다', () => {
  assert.equal(FIXED_SPLASH_TICKER, '관리자 몰래 내맘대로 홈페이지 로딩하는 중.')
  assert.ok(SPLASH_TICKER_POOL.includes(FIXED_SPLASH_TICKER), '고정 문구가 풀에 없다')
  assert.equal(SPLASH_TICKER_POOL.filter(message => message === FIXED_SPLASH_TICKER).length, 1, '풀에 고정 문구가 한 번만 있어야 한다')
})
