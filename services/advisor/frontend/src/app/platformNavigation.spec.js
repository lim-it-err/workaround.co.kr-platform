import { describe, expect, it } from 'vitest'
import { platformHomePath } from './platformNavigation.js'

describe('platform home from the Advisor build base', () => {
  it.each([
    ['/advisor/', '/'],
    ['/advisor', '/'],
    ['/workaround.co.kr-platform/advisor/', '/workaround.co.kr-platform/'],
    ['/preview/advisor/project/advisor/', '/preview/advisor/project/'],
  ])('maps %s to %s', (base, home) => {
    expect(platformHomePath(base)).toBe(home)
  })

  it.each(['/', '/preview/', '/advisor-extra/', 'https://example.com/advisor/', '//example.com/advisor/', '/advisor/?q=1', '/advisor/#home', '/\\example.com/advisor/'])('does not link a standalone or invalid base: %s', base => {
    expect(platformHomePath(base)).toBeNull()
  })
})
