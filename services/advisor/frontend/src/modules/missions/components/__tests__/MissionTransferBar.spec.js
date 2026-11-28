import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import MissionTransferBar from '../MissionTransferBar.vue'
import * as zip from '../../utils/zip.js'

vi.mock('../../utils/zip.js', () => ({ downloadMissionZip: vi.fn() }))

let host
function mount(mission) {
  host = document.createElement('div')
  document.body.appendChild(host)
  createApp(MissionTransferBar, { mission }).mount(host)
  return host
}
afterEach(() => { host?.remove(); host = null })

describe('MissionTransferBar', () => {
  it('starterTests 가 있으면 이지·하드 버튼, 이지가 강조', () => {
    const el = mount({ id: 'm1', starterTests: [{ path: 'T.java' }] })
    const btns = [...el.querySelectorAll('button')].map((b) => b.textContent.trim())
    expect(btns).toEqual(['⬇ 이지 — 테스트 포함', '⬇ 하드 — 테스트 직접'])
    el.querySelectorAll('button')[0].click()
    expect(zip.downloadMissionZip).toHaveBeenCalledWith(expect.objectContaining({ id: 'm1' }), 'easy')
  })

  it('starterTests 가 없으면 단일 버튼 + 안내 명령은 hard', async () => {
    const el = mount({ id: 'm2' })
    expect(el.querySelector('button').textContent.trim()).toBe('⬇ 코드 전체 받기 (.zip)')
    el.querySelector('button').click()
    expect(zip.downloadMissionZip).toHaveBeenCalledWith(expect.objectContaining({ id: 'm2' }))
    const link = el.querySelector('a')
    expect(link.getAttribute('href')).toContain('codespaces.new/lim-it-err/workaround.co.kr-platform')
    expect(link.getAttribute('href')).toContain('devcontainer_path=.devcontainer%2Fadvisor-lab%2Fdevcontainer.json')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(el.querySelector('.transfer-guide')).toBeNull()
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await nextTick()
    expect(el.querySelector('.transfer-cmd code').textContent).toBe('tools/advisor-lab.sh m2 hard')
  })

  it('복사: clipboard 성공/실패 모두 상태 문구를 보인다', async () => {
    const el = mount({ id: 'm3', starterTests: [{}] })
    el.querySelector('a').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await nextTick()
    expect(el.querySelector('.transfer-cmd code').textContent).toBe('tools/advisor-lab.sh m3 easy')
    const writeText = vi.fn().mockResolvedValue()
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    el.querySelector('.transfer-copy').click()
    await new Promise((r) => setTimeout(r))
    expect(writeText).toHaveBeenCalledWith('tools/advisor-lab.sh m3 easy')
    expect(el.querySelector('[role=status]').textContent).toContain('복사했어요')
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockRejectedValue(new Error('x')) }, configurable: true })
    el.querySelector('.transfer-copy').click()
    await new Promise((r) => setTimeout(r))
    expect(el.querySelector('[role=status]').textContent).toContain('선택')
  })
})
