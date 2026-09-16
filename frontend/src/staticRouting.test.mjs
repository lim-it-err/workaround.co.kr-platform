import assert from 'node:assert/strict'
import { LINES } from './data/lines.js'
import {
  buildLivePath,
  isStaticPageUnavailable,
  normalizeBasePath,
  readLiveRoute,
  STATIC_UNAVAILABLE_LIVE_PAGES,
  stripBasePath,
  withBasePath
} from './staticRouting.js'

const projectBase = '/workaround.co.kr-platform/'

assert.equal(normalizeBasePath('workaround.co.kr-platform'), projectBase)
assert.equal(stripBasePath('/workaround.co.kr-platform/voyage', projectBase), '/voyage')
assert.equal(withBasePath('/studio', projectBase), '/workaround.co.kr-platform/studio')
assert.deepEqual(readLiveRoute('/workaround.co.kr-platform/voyage', projectBase), { page: 'voyage', slug: '' })
assert.deepEqual(readLiveRoute('/workaround.co.kr-platform/blog', projectBase), { page: 'blogArchive', slug: '' })
assert.deepEqual(readLiveRoute('/workaround.co.kr-platform/blog/day-1', projectBase), { page: 'blogPost', slug: 'day-1' })
assert.deepEqual(readLiveRoute('/workaround.co.kr-platform/studio', projectBase), { page: 'writingStudio', slug: '' })
assert.equal(readLiveRoute('/workaround.co.kr-platform/', projectBase), null)
assert.equal(buildLivePath('voyage', '', projectBase), '/workaround.co.kr-platform/voyage')
assert.equal(buildLivePath('blogPost', '프라하 첫날', projectBase), '/workaround.co.kr-platform/blog/%ED%94%84%EB%9D%BC%ED%95%98%20%EC%B2%AB%EB%82%A0')
assert.deepEqual(STATIC_UNAVAILABLE_LIVE_PAGES, ['work', 'runtime', 'ops', 'signals'])
assert.equal(isStaticPageUnavailable('simhub'), false)
assert.equal(isStaticPageUnavailable('taxi'), false)
assert.equal(isStaticPageUnavailable('elevator'), false)
assert.equal(isStaticPageUnavailable('work'), true)
assert.equal(isStaticPageUnavailable('runtime'), true)

console.log('static routing: project base and deep links pass')

const advisor = LINES.find(line => line.code === 'A')
assert.equal(advisor.upcoming, false)
assert.equal(advisor.render, 'static')
assert.equal(withBasePath(advisor.entryPath, projectBase), '/workaround.co.kr-platform/advisor/')
assert.equal(withBasePath(advisor.entryPath, '/'), '/advisor/')
