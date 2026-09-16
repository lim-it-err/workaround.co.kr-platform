import { describe, expect, it } from 'vitest'
import { formatDuration } from '../durationFormat.js'

describe('분 단위 시간 표기', () => {
  it.each([
    [0, '0분'],
    [59, '59분'],
    [60, '1시간'],
    [90, '1시간 30분'],
    [4535, '약 76시간'],
  ])('%d분을 %s으로 읽기 쉽게 바꾼다', (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected)
  })
})
