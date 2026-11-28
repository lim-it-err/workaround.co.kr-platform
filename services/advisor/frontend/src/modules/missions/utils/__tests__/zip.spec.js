import { describe, expect, it } from 'vitest'
import { buildMissionEntries, buildZip, crc32, safeZipPath } from '../zip.js'

// 무압축 ZIP 을 중앙 디렉터리부터 직접 파싱한다.
function parse(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const eocd = bytes.length - 22
  expect(dv.getUint32(eocd, true)).toBe(0x06054b50)
  const count = dv.getUint16(eocd + 10, true)
  let p = dv.getUint32(eocd + 16, true)
  const td = new TextDecoder()
  const out = []
  for (let i = 0; i < count; i++) {
    expect(dv.getUint32(p, true)).toBe(0x02014b50)
    const flags = dv.getUint16(p + 8, true)
    const crc = dv.getUint32(p + 16, true)
    const size = dv.getUint32(p + 24, true)
    const nlen = dv.getUint16(p + 28, true)
    const off = dv.getUint32(p + 42, true)
    const name = td.decode(bytes.subarray(p + 46, p + 46 + nlen))
    expect(dv.getUint32(off, true)).toBe(0x04034b50)
    const lnlen = dv.getUint16(off + 26, true)
    const data = bytes.subarray(off + 30 + lnlen, off + 30 + lnlen + size)
    out.push({ name, flags, crc, content: td.decode(data), data })
    p += 46 + nlen
  }
  return out
}

describe('zip', () => {
  it('crc32 표준값', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926)
  })
  it('파일 목록·내용·CRC·UTF-8 플래그', () => {
    const zip = buildZip([
      { path: 'src/main/java/한글/주문.java', content: '// 안녕 세상\nclass A {}' },
      { path: 'pom.xml', content: '<p/>' },
    ])
    const e = parse(zip)
    expect(e.map((x) => x.name)).toEqual(['src/main/java/한글/주문.java', 'pom.xml'])
    expect(e[0].content).toBe('// 안녕 세상\nclass A {}')
    expect(e[0].flags & 0x0800).toBe(0x0800)
    for (const x of e) expect(crc32(x.data)).toBe(x.crc)
  })
  it('위험한 경로는 files/<n>.txt', () => {
    expect(safeZipPath('', 0)).toBe('files/1.txt')
    expect(safeZipPath('../a', 1)).toBe('files/2.txt')
    expect(safeZipPath('/etc/x', 2)).toBe('files/3.txt')
    expect(safeZipPath('C:\\x', 3)).toBe('files/4.txt')
    expect(safeZipPath('a\\b.java', 4)).toBe('a/b.java')
  })
  it('미션 묶음: README 맨 위', () => {
    const e = buildMissionEntries({
      title: 'T', requirements: ['가', '나'],
      legacyFiles: [{ path: 'a.java', content: 'x' }], providedFiles: [{ path: 'b.java', content: 'y' }],
    })
    expect(e.map((x) => x.path)).toEqual(['README.md', 'a.java', 'b.java'])
    expect(e[0].content).toContain('1. 가')
    expect(e[0].content).toContain('제공 코드는 수정하지 않는다.')
  })
})
