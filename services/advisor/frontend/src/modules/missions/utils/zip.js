// 의존성 없는 무압축(STORE) ZIP 작성기 + 브라우저 내려받기 도우미.
// 전부 브라우저 안에서 처리한다(서버 호출 없음 — 정적 모드에서도 동작).

const encoder = new TextEncoder()

let crcTable = null
export function crc32(bytes) {
  if (!crcTable) {
    crcTable = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      crcTable[n] = c >>> 0
    }
  }
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

// 비었거나 `..`·절대경로·드라이브 경로면 files/<n>.txt 로 바꾼다.
export function safeZipPath(path, index) {
  const fallback = `files/${index + 1}.txt`
  if (typeof path !== 'string') return fallback
  const p = path.replace(/\\/g, '/').trim()
  if (!p || p.startsWith('/') || /^[a-zA-Z]:/.test(p)) return fallback
  const parts = p.split('/')
  if (parts.some((s) => s === '..' || s === '')) return fallback
  return parts.filter((s) => s !== '.').join('/') || fallback
}

// entries: [{ path, content }] → Uint8Array (ZIP). 일반 비트 11 = UTF-8 파일명.
export function buildZip(entries) {
  const chunks = []
  const central = []
  let offset = 0
  const used = new Set()
  entries.forEach((e, i) => {
    let path = safeZipPath(e.path, i)
    if (used.has(path)) path = `files/${i + 1}.txt`
    used.add(path)
    const name = encoder.encode(path)
    const data = encoder.encode(e.content ?? '')
    const crc = crc32(data)
    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true)
    local.setUint16(4, 20, true)
    local.setUint16(6, 0x0800, true)
    local.setUint16(8, 0, true)
    local.setUint16(10, 0, true)
    local.setUint16(12, 0x21, true) // 1980-01-01
    local.setUint32(14, crc, true)
    local.setUint32(18, data.length, true)
    local.setUint32(22, data.length, true)
    local.setUint16(26, name.length, true)
    local.setUint16(28, 0, true)
    chunks.push(new Uint8Array(local.buffer), name, data)
    const cd = new DataView(new ArrayBuffer(46))
    cd.setUint32(0, 0x02014b50, true)
    cd.setUint16(4, 20, true)
    cd.setUint16(6, 20, true)
    cd.setUint16(8, 0x0800, true)
    cd.setUint16(12, 0, true)
    cd.setUint16(14, 0x21, true)
    cd.setUint32(16, crc, true)
    cd.setUint32(20, data.length, true)
    cd.setUint32(24, data.length, true)
    cd.setUint16(28, name.length, true)
    cd.setUint32(42, offset, true)
    central.push(new Uint8Array(cd.buffer), name)
    offset += 30 + name.length + data.length
  })
  const cdSize = central.reduce((s, c) => s + c.length, 0)
  const end = new DataView(new ArrayBuffer(22))
  end.setUint32(0, 0x06054b50, true)
  end.setUint16(8, entries.length, true)
  end.setUint16(10, entries.length, true)
  end.setUint32(12, cdSize, true)
  end.setUint32(16, offset, true)
  const all = [...chunks, ...central, new Uint8Array(end.buffer)]
  const out = new Uint8Array(all.reduce((s, c) => s + c.length, 0))
  let pos = 0
  for (const c of all) {
    out.set(c, pos)
    pos += c.length
  }
  return out
}

// 미션 한 개의 받을 파일 묶음: README.md + legacyFiles + providedFiles.
export function buildMissionEntries(mission) {
  const reqs = (mission.requirements ?? []).map((r, i) => `${i + 1}. ${r}`).join('\n')
  const readme = `# ${mission.title}\n\n## 요구사항\n\n${reqs}\n\n제공 코드는 수정하지 않는다.\n`
  return [
    { path: 'README.md', content: readme },
    ...(mission.legacyFiles ?? []),
    ...(mission.providedFiles ?? []),
  ]
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function downloadText(content, filename) {
  downloadBlob(new Blob([content ?? ''], { type: 'text/plain;charset=utf-8' }), filename)
}

export function downloadMissionZip(mission) {
  const bytes = buildZip(buildMissionEntries(mission))
  downloadBlob(new Blob([bytes], { type: 'application/zip' }), `${mission.id}.zip`)
}
