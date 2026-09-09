import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const EXPECTED_BASE = '/workaround.co.kr-platform/'
const LOCAL_REFERENCE_PATTERN = /\b(?:href|src)=(['"])(.*?)\1/gi

function readArguments(argv) {
  const parsed = new Map()
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]
    const value = argv[index + 1]
    if (!key?.startsWith('--') || value === undefined) {
      throw new Error(`Invalid argument sequence near ${key || '<end>'}.`)
    }
    parsed.set(key.slice(2), value)
  }
  return parsed
}

function stripQueryAndHash(value) {
  return value.split(/[?#]/, 1)[0]
}

function isExternalReference(value) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value)
}

function collectLocalReferences(html) {
  const references = []
  for (const match of html.matchAll(LOCAL_REFERENCE_PATTERN)) {
    const reference = match[2].trim()
    if (reference && !isExternalReference(reference)) {
      references.push(reference)
    }
  }
  return references
}

function assertArtifactReference(reference, distDirectory, base) {
  const cleanReference = decodeURIComponent(stripQueryAndHash(reference))
  if (!cleanReference.startsWith(base)) {
    throw new Error(`Artifact reference does not use the GitHub Pages base: ${reference}`)
  }

  const relativePath = cleanReference.slice(base.length)
  if (!relativePath) {
    return
  }

  const target = resolve(distDirectory, relativePath)
  const distRoot = `${resolve(distDirectory)}/`
  if (!target.startsWith(distRoot) || !existsSync(target)) {
    throw new Error(`Artifact reference is missing from dist: ${reference}`)
  }
}

const args = readArguments(process.argv.slice(2))
const distDirectory = resolve(args.get('dist') || 'frontend/dist')
const base = args.get('base') || EXPECTED_BASE
const commitSha = args.get('sha') || process.env.GITHUB_SHA || 'local'
const builtAt = args.get('built-at') || new Date().toISOString()

if (base !== EXPECTED_BASE) {
  throw new Error(`Expected GitHub Pages base ${EXPECTED_BASE}, received ${base}.`)
}

const indexPath = resolve(distDirectory, 'index.html')
if (!existsSync(indexPath)) {
  throw new Error(`GitHub Pages output is missing: ${indexPath}`)
}

const indexHtml = readFileSync(indexPath, 'utf8')
const references = collectLocalReferences(indexHtml)
if (references.length === 0) {
  throw new Error('No local JS, CSS, asset, manifest, or icon references were found in index.html.')
}
for (const reference of references) {
  assertArtifactReference(reference, distDirectory, base)
}

writeFileSync(resolve(distDirectory, '404.html'), indexHtml, 'utf8')
writeFileSync(resolve(distDirectory, '.nojekyll'), '', 'utf8')
writeFileSync(
  resolve(distDirectory, 'deployment.json'),
  `${JSON.stringify({ commitSha, builtAt, base }, null, 2)}\n`,
  'utf8'
)

const fallbackHtml = readFileSync(resolve(distDirectory, '404.html'), 'utf8')
for (const reference of collectLocalReferences(fallbackHtml)) {
  assertArtifactReference(reference, distDirectory, base)
}

console.log(`GitHub Pages artifact verified: ${distDirectory}`)
console.log(`Base path: ${base}`)
console.log(`Commit SHA: ${commitSha}`)
console.log(`Local references checked: ${references.length}`)
