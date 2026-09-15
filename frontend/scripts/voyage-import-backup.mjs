#!/usr/bin/env node

import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { mergeVoyageDayRecords } from '../src/data/voyages/schema.js'

const frontendRoot = fileURLToPath(new URL('../', import.meta.url))
const defaultDataDirectory = join(frontendRoot, 'src/data/voyages')
const defaultPublicDirectory = join(frontendRoot, 'public')
const importStart = '// voyage-import:start'
const importEnd = '// voyage-import:end'

function plainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

export function parseVoyageBackup(text) {
  const backup = JSON.parse(text)
  if (backup?.format !== 'workaround-voyage-day-records' || backup.version !== 1) {
    throw new Error('지원하지 않는 여행 백업 형식입니다.')
  }
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(String(backup.voyageId || ''))) {
    throw new Error('여행 ID가 올바르지 않습니다.')
  }
  if (!plainObject(backup.records)) throw new Error('여행 기록이 없는 백업입니다.')
  return backup
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function findVoyageDataFile(voyageId, directory) {
  const candidates = []
  for (const name of await readdir(directory)) {
    if (!name.endsWith('.js') || ['index.js', 'schema.js'].includes(name)) continue
    const file = join(directory, name)
    const source = await readFile(file, 'utf8')
    if (new RegExp(`\\bid\\s*:\\s*['\"]${escapeRegExp(voyageId)}['\"]`).test(source)) candidates.push(file)
  }
  if (candidates.length !== 1) throw new Error(`여행 데이터 파일을 하나로 찾지 못했습니다: ${voyageId}`)
  return candidates[0]
}

function findMatchingBrace(source, openIndex) {
  let depth = 0
  let quote = ''
  let escaped = false
  let lineComment = false
  let blockComment = false
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index]
    const next = source[index + 1]
    if (lineComment) {
      if (char === '\n') lineComment = false
      continue
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false
        index += 1
      }
      continue
    }
    if (quote) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === quote) quote = ''
      continue
    }
    if (char === '/' && next === '/') {
      lineComment = true
      index += 1
      continue
    }
    if (char === '/' && next === '*') {
      blockComment = true
      index += 1
      continue
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char
      continue
    }
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return index
    }
  }
  throw new Error('여행 데이터 객체의 닫는 괄호를 찾지 못했습니다.')
}

function formatActual(actual) {
  const json = JSON.stringify(actual, null, 2)
  return json.split('\n').map((line, index) => index === 0 ? line : `      ${line}`).join('\n')
}

function replaceDayActual(dayBlock, actual) {
  const section = `      ${importStart}\n      actual: ${formatActual(actual)}\n      ${importEnd}`
  const start = dayBlock.indexOf(`      ${importStart}`)
  const end = dayBlock.indexOf(`      ${importEnd}`)
  if (start >= 0 || end >= 0) {
    if (start < 0 || end < start) throw new Error('여행 import 마커가 손상되었습니다.')
    return `${dayBlock.slice(0, start)}${section}${dayBlock.slice(end + `      ${importEnd}`.length)}`
  }

  const actualMatch = /^      actual\s*:\s*\{/m.exec(dayBlock)
  if (actualMatch) {
    const propertyStart = actualMatch.index
    const valueStart = dayBlock.indexOf('{', propertyStart)
    const valueEnd = findMatchingBrace(dayBlock, valueStart)
    return `${dayBlock.slice(0, propertyStart)}      actual: ${formatActual(actual)}${dayBlock.slice(valueEnd + 1)}`
  }

  const closeIndex = dayBlock.length - 1
  let body = dayBlock.slice(0, closeIndex).replace(/\s+$/, '')
  if (!body.endsWith(',')) body += ','
  return `${body}\n${section}\n    }`
}

export function updateVoyageDataSource(source, actualByDate) {
  const ranges = []
  for (const [date, actual] of actualByDate) {
    const pattern = new RegExp(`^    \\{\\n      date\\s*:\\s*['\"]${escapeRegExp(date)}['\"]`, 'm')
    const match = pattern.exec(source)
    if (!match) throw new Error(`${date}: 데이터 파일에서 일차 객체를 찾지 못했습니다.`)
    const objectStart = source.indexOf('{', match.index)
    const objectEnd = findMatchingBrace(source, objectStart)
    ranges.push({ start: objectStart, end: objectEnd + 1, actual })
  }
  return ranges.sort((left, right) => right.start - left.start).reduce((next, range) => (
    `${next.slice(0, range.start)}${replaceDayActual(next.slice(range.start, range.end), range.actual)}${next.slice(range.end)}`
  ), source)
}

function structuralDiff(dataFile, before, after, changedDates, assets) {
  const lines = [`--- ${dataFile}`, `+++ ${dataFile} (여행 백업 병합)`]
  for (const date of changedDates) {
    const previous = before.days.find((day) => day.date === date)?.actual || {}
    const next = after.days.find((day) => day.date === date)?.actual || {}
    lines.push(`@@ ${date} @@`)
    lines.push(`~ actual.record: ${previous.record ? '있음' : '없음'} -> ${next.record ? '있음' : '없음'}`)
    lines.push(`~ actual.meals: ${(previous.meals || []).length} -> ${(next.meals || []).length}`)
    lines.push(`~ actual.spend.items: ${(previous.spend?.items || []).length} -> ${(next.spend?.items || []).length}`)
    lines.push(`~ actual.photos: ${(previous.photos || []).length} -> ${(next.photos || []).length}`)
  }
  for (const asset of assets) lines.push(`+ frontend/public/${asset.relativePath}`)
  return lines.join('\n')
}

async function atomicWrite(file, content) {
  const temporary = `${file}.voyage-import.tmp`
  await writeFile(temporary, content)
  await rename(temporary, file)
}

export async function importVoyageBackup({
  backupPath,
  write = false,
  voyage: suppliedVoyage,
  dataFile: suppliedDataFile,
  dataDirectory = defaultDataDirectory,
  publicDirectory = defaultPublicDirectory,
  logger = console.log
}) {
  const absoluteBackup = resolve(backupPath)
  const backup = parseVoyageBackup(await readFile(absoluteBackup, 'utf8'))
  let voyage = suppliedVoyage
  if (!voyage) {
    const { findVoyageById } = await import(pathToFileURL(join(dataDirectory, 'index.js')).href)
    voyage = findVoyageById(backup.voyageId)
  }
  if (!voyage || voyage.id !== backup.voyageId) throw new Error('백업과 일치하는 여행이 없습니다.')

  const dataFile = suppliedDataFile || await findVoyageDataFile(backup.voyageId, dataDirectory)
  const source = await readFile(dataFile, 'utf8')
  const merged = mergeVoyageDayRecords(voyage, backup.records)
  const actualByDate = merged.changedDates.map((date) => [
    date,
    merged.voyage.days.find((day) => day.date === date).actual
  ])
  const nextSource = updateVoyageDataSource(source, actualByDate)
  logger(structuralDiff(relative(process.cwd(), dataFile) || dataFile, voyage, merged.voyage, merged.changedDates, merged.assets))
  for (const asset of merged.assets.filter((item) => item.size > 400 * 1024)) {
    logger(`[경고] ${asset.publicPath}: 사진이 400kB를 넘습니다 (${asset.size} bytes).`)
  }

  if (!write) {
    logger('[dry-run] 파일을 바꾸지 않았습니다. 확인 후 --write로 다시 실행하세요.')
    return { ...merged, dataFile, wrote: false, source: nextSource }
  }

  for (const asset of merged.assets) {
    const target = join(publicDirectory, asset.relativePath)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, Buffer.from(asset.base64, 'base64'))
  }
  await atomicWrite(dataFile, nextSource)
  logger(`[write] ${relative(process.cwd(), dataFile) || dataFile}와 사진 ${merged.assets.length}개를 갱신했습니다.`)
  return { ...merged, dataFile, wrote: true, source: nextSource }
}

async function main() {
  const args = process.argv.slice(2)
  const write = args.includes('--write')
  const positional = args.filter((arg) => arg !== '--write')
  const unknown = args.filter((arg) => arg.startsWith('--') && arg !== '--write')
  if (unknown.length || positional.length !== 1) {
    throw new Error('사용법: node frontend/scripts/voyage-import-backup.mjs <backup.json> [--write]')
  }
  await importVoyageBackup({ backupPath: positional[0], write })
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`[voyage-import] ${error.message}`)
    process.exitCode = 1
  })
}
