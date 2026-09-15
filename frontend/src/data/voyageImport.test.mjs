import assert from 'node:assert/strict'
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { importVoyageBackup } from '../../scripts/voyage-import-backup.mjs'
import { defineVoyage, mergeVoyageDayRecords } from './voyages/schema.js'

const tinyPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

function fixtureVoyage() {
  return defineVoyage({
    id: 'sample-trip',
    days: [
      {
        date: '2026-09-01', city: '첫 도시', am: '기존 식당 점심', pm: '산책', eve: '휴식',
        record: '데이터 파일 메모',
        meals: [
          { slot: '점심', place: '기존 식당', dish: '기존 메뉴', amount: 10, currency: 'EUR', mapUrl: 'https://maps.google.com/?q=old' },
          { slot: '간식', place: '정적 전용', dish: '케이크', amount: 5, currency: 'EUR', mapUrl: '' }
        ],
        spend: { items: [{ label: '기존 식당', amount: 1 }, { label: '교통', amount: 2 }], total: 3 },
        photos: [{ src: '/manual/photo.jpg', caption: '정적 사진' }]
      },
      {
        date: '2026-09-02', city: '둘째 도시', am: '둘째 식당 아침', pm: '이동', eve: '휴식',
        meals: [{ slot: '아침', place: '둘째 식당', dish: '빵', amount: 4, currency: 'EUR', mapUrl: '' }],
        spend: { items: [], total: 0 }, photos: []
      }
    ]
  })
}

function fixtureBackup() {
  return {
    format: 'workaround-voyage-day-records',
    version: 1,
    exportedAt: '2026-09-18T12:00:00.000Z',
    voyageId: 'sample-trip',
    records: {
      '2026-09-01': {
        note: '현장 하루 메모',
        stops: {
          'timeline-0-0': {
            place: '현장 식당', dish: '굴라시', localAmount: '25', currency: 'EUR', krwAmount: '70000',
            note: '창가 자리', mapUrl: 'https://maps.google.com/?q=new',
            photos: [{ src: `data:image/png;base64,${tinyPng}`, caption: '점심 사진' }]
          }
        }
      },
      '2026-09-02': {
        note: '',
        stops: {
          'timeline-1-0': {
            place: '둘째 현장 식당', dish: '수프', localAmount: '12', currency: 'EUR', krwAmount: '35000',
            note: '', mapUrl: '', photos: []
          }
        }
      }
    }
  }
}

test('2일·식사 2건 백업을 actual에 병합한다', () => {
  const source = fixtureVoyage()
  const merged = mergeVoyageDayRecords(source, fixtureBackup().records)

  assert.deepEqual(merged.changedDates, ['2026-09-01', '2026-09-02'])
  assert.equal(merged.voyage.days[0].actual.meals.find((meal) => meal.stopId === 'timeline-0-0').place, '현장 식당')
  assert.equal(merged.voyage.days[1].actual.meals.find((meal) => meal.stopId === 'timeline-1-0').dish, '수프')
  assert.equal(merged.voyage.days[0].actual.spend.items.find((item) => item.stopId === 'timeline-0-0').amount, 7)
  assert.equal(source.days[0].actual.meals[0].place, '기존 식당', '순수 병합은 입력을 바꾸지 않아야 한다')
})

test('백업 값을 우선하면서 데이터 파일 전용 값을 보존한다', () => {
  const { voyage } = mergeVoyageDayRecords(fixtureVoyage(), fixtureBackup().records)
  const actual = voyage.days[0].actual

  assert.match(actual.record, /^현장 하루 메모\n현장 식당: 창가 자리$/)
  assert.equal(actual.meals.some((meal) => meal.place === '정적 전용' && meal.dish === '케이크'), true)
  assert.equal(actual.spend.items.some((item) => item.label === '교통' && item.amount === 2), true)
  assert.equal(actual.spend.total, 9, '기존 교통 2만원과 현장 식사 7만원이 합산되어야 한다')
  assert.equal(actual.photos.some((photo) => photo.src === '/manual/photo.jpg'), true)
})

test('dry-run은 쓰지 않고 --write만 데이터와 사진을 만든다', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'voyage-import-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const dataFile = join(directory, 'sample-trip.js')
  const publicDirectory = join(directory, 'public')
  const backupPath = join(directory, 'sample.voyage-backup.json')
  const source = `import { defineVoyage } from './schema.js'\n\nexport const SAMPLE = defineVoyage({\n  id: 'sample-trip',\n  days: [\n    {\n      date: '2026-09-01',\n      city: '첫 도시'\n    },\n    {\n      date: '2026-09-02',\n      city: '둘째 도시'\n    }\n  ]\n})\n`
  await writeFile(dataFile, source)
  await writeFile(backupPath, `${JSON.stringify(fixtureBackup(), null, 2)}\n`)
  const output = []

  const dryRun = await importVoyageBackup({
    backupPath, voyage: fixtureVoyage(), dataFile, publicDirectory, logger: (line) => output.push(line)
  })
  assert.equal(dryRun.wrote, false)
  assert.equal(await readFile(dataFile, 'utf8'), source)
  await assert.rejects(access(join(publicDirectory, 'voyage/sample-trip/2026-09-01-1.png')))
  assert.match(output.join('\n'), /^--- /)
  assert.match(output.join('\n'), /\+\+\+ .*여행 백업 병합/)
  assert.match(output.join('\n'), /\[dry-run\] 파일을 바꾸지 않았습니다/)

  const written = await importVoyageBackup({
    backupPath, write: true, voyage: fixtureVoyage(), dataFile, publicDirectory, logger: () => {}
  })
  assert.equal(written.wrote, true)
  const nextSource = await readFile(dataFile, 'utf8')
  assert.match(nextSource, /voyage-import:start/)
  assert.match(nextSource, /"place": "현장 식당"/)
  assert.equal((nextSource.match(/voyage-import:start/g) || []).length, 2)
  const photo = await readFile(join(publicDirectory, 'voyage/sample-trip/2026-09-01-1.png'))
  assert.equal(photo.subarray(1, 4).toString(), 'PNG')
  assert.equal(written.assets[0].publicPath, '/voyage/sample-trip/2026-09-01-1.png')

  await importVoyageBackup({
    backupPath, write: true, voyage: fixtureVoyage(), dataFile, publicDirectory, logger: () => {}
  })
  const rerunSource = await readFile(dataFile, 'utf8')
  assert.equal((rerunSource.match(/voyage-import:start/g) || []).length, 2, '재실행 시 import 블록을 중복하지 않아야 한다')
})
