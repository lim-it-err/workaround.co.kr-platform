import { describe, expect, it } from 'vitest'
import { buildMissionEntries, buildPomXml, buildZip, crc32, safeZipPath, toArtifactId } from '../zip.js'

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
  it('미션 묶음: pom.xml 맨 위, README 다음', () => {
    const e = buildMissionEntries({
      id: 'm-1', title: 'T', requirements: ['가', '나'],
      legacyFiles: [{ path: 'a.java', content: 'x' }], providedFiles: [{ path: 'b.java', content: 'y' }],
    })
    expect(e.map((x) => x.path)).toEqual(['pom.xml', 'README.md', 'a.java', 'b.java'])
    const readme = e[1].content
    expect(readme).toContain('1. 가')
    expect(readme).toContain('제공 코드는 수정하지 않는다.')
    expect(readme).toContain('IntelliJ')
    expect(readme).toContain('`mvn -q test`')
  })
  it('pom.xml: groupId·artifactId 정리·Java 21·JUnit 5.10.2·surefire 3.2.5', () => {
    const pom = buildPomXml({ id: 'Budapest Bath_2/Ω' })
    expect(pom).toContain('<groupId>kr.workaround.advisor</groupId>')
    expect(pom).toContain('<artifactId>budapest-bath-2</artifactId>')
    expect(pom).toContain('<maven.compiler.release>21</maven.compiler.release>')
    expect(pom).toContain('<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>')
    expect(pom).toContain('<version>5.10.2</version>')
    expect(pom).toContain('<scope>test</scope>')
    expect(pom).toContain('<version>3.2.5</version>')
    expect(toArtifactId('')).toBe('mission')
    expect(toArtifactId('---')).toBe('mission')
  })
  it('미션에 빌드 파일이 있으면 pom.xml 을 넣지 않는다', () => {
    for (const name of ['pom.xml', 'build.gradle', 'build.gradle.kts']) {
      const e = buildMissionEntries({ id: 'x', title: 'T', legacyFiles: [{ path: name, content: 'mine' }] })
      expect(e.map((x) => x.path)).toEqual(['README.md', name])
      expect(e[1].content).toBe('mine')
    }
  })
  describe('이지/하드 (starterTests)', () => {
    const m = {
      id: 'x-1', title: 'T', requirements: ['가'],
      legacyFiles: [
        { path: 'src/main/java/A.java', content: 'a' },
        { path: 'src/test/java/ATest.java', content: 'skeleton' },
      ],
      starterTests: [
        { path: 'src/test/java/ATest.java', content: 'real test' },
        { path: 'src/test/java/BTest.java', content: 'b test' },
      ],
    }
    it('easy: starterTests 포함, 같은 경로는 대체(중복 없음)', () => {
      const e = buildMissionEntries(m, { level: 'easy' })
      const paths = e.map((x) => x.path)
      expect(paths).toEqual(['pom.xml', 'README.md', 'src/main/java/A.java', 'src/test/java/ATest.java', 'src/test/java/BTest.java'])
      expect(new Set(paths).size).toBe(paths.length)
      expect(e.find((x) => x.path === 'src/test/java/ATest.java').content).toBe('real test')
    })
    it('hard(기본): starterTests 제외, 뼈대 유지', () => {
      for (const e of [buildMissionEntries(m), buildMissionEntries(m, { level: 'hard' })]) {
        const paths = e.map((x) => x.path)
        expect(paths).not.toContain('src/test/java/BTest.java')
        expect(e.find((x) => x.path === 'src/test/java/ATest.java').content).toBe('skeleton')
      }
    })
    it('README 문구', () => {
      const easy = buildMissionEntries(m, { level: 'easy' })[1].content
      const hard = buildMissionEntries(m, { level: 'hard' })[1].content
      expect(easy).toContain('테스트가 미리 들어 있습니다')
      expect(easy).toContain('테스트 파일은 고치지 않습니다.')
      expect(easy).not.toContain('테스트는 직접 씁니다')
      expect(hard).toContain('테스트는 직접 씁니다 — 채점 기준의 테스트 항목을 보세요.')
      expect(hard).not.toContain('미리 들어 있습니다')
    })
    it('starterTests 없는 미션 README 는 기존과 같다', () => {
      const r = buildMissionEntries({ id: 'y', title: 'T', requirements: [] })[1].content
      expect(r).not.toContain('테스트는 직접 씁니다')
      expect(r).not.toContain('미리 들어 있습니다')
    })
  })
})
