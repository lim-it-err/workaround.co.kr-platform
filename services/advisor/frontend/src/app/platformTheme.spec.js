import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { URL as FileURL } from 'node:url'

// TKT-247 — Advisor 는 모선 v0.9(검은 바탕 하나) 토큰을 따르고, 라이트 테마·테마 저장 키를 쓰지 않는다.
const read = path => readFileSync(new FileURL(path, import.meta.url), 'utf8')
const mother = read('../../../../../frontend/src/styles.css')
const adapter = read('./platform.css')

function rootTokens(css) {
  const result = {}
  for (const block of css.matchAll(/:root\s*\{([^}]+)\}/g)) {
    for (const [, name, value] of block[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)) result[name] = value.replace(/\s+/g, '')
  }
  return result
}

describe('Advisor v0.9 theme', () => {
  it('shares at least 20 :root tokens with the motherframe and every shared value matches', () => {
    const expected = rootTokens(mother)
    const actual = rootTokens(adapter)
    const shared = Object.keys(actual).filter(key => key in expected)
    expect(shared.length).toBeGreaterThanOrEqual(20)
    for (const key of shared) expect(actual[key], key).toBe(expected[key])
    expect(actual['--bg']).toBe('#0c0c0c')
    expect(actual['--line-d']).toBe('#a9b3ff')
  })

  it('points the Advisor accent at line-d and keeps the module vocabulary aliases', () => {
    const actual = rootTokens(adapter)
    expect(actual['--accent']).toBe('var(--line-d)')
    for (const alias of ['--bg-card', '--fg', '--fg-dim', '--accent-soft', '--good', '--warn', '--bad', '--accent-ink']) {
      expect(actual, alias).toHaveProperty(alias)
    }
  })

  it('has no light theme block and no workaround-theme key anywhere in the shell', () => {
    const app = read('./App.vue')
    const styles = read('./styles.css')
    for (const [name, text] of [['platform.css', adapter], ['App.vue', app], ['styles.css', styles]]) {
      expect(text, name).not.toMatch(/data-theme/)
      expect(text, name).not.toMatch(/workaround-theme/)
      expect(text, name).not.toMatch(/color-scheme:\s*light/)
    }
    expect(app).not.toMatch(/밝게 보기|어둡게 보기/)
  })

  it('builds the shell from the motherframe vocabulary', () => {
    const app = read('./App.vue')
    for (const cls of ['app-shell', 'portal-stage', 'station-topbar', 'roundel', 'topbar-actions']) expect(app).toContain(cls)
    expect(app).not.toContain('StationHeader')
  })
})
