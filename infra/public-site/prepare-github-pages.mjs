import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  BLOG_MOCKUP_FILES,
  copiedPaths,
  isBlogMockupFile,
  readBlogLineOpen,
} from './route-rules.mjs'

const EXPECTED_BASE = '/workaround.co.kr-platform/'
const EXPECTED_ADVISOR_BASE = `${EXPECTED_BASE}advisor/`
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

function verifyIndex(indexPath, distDirectory, base, label) {
  if (!existsSync(indexPath)) {
    throw new Error(`${label} output is missing: ${indexPath}`)
  }

  const html = readFileSync(indexPath, 'utf8')
  const references = collectLocalReferences(html)
  if (references.length === 0) {
    throw new Error(`No local references were found in ${label} index.html.`)
  }
  for (const reference of references) {
    assertArtifactReference(reference, distDirectory, base)
  }
  return { html, references }
}

function createFallbackHtml(base, advisorBase) {
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>workaround central</title>
  </head>
  <body>
    <script>
      const base = ${JSON.stringify(base)};
      const advisorBase = ${JSON.stringify(advisorBase)};
      const entry = window.location.pathname.startsWith(advisorBase) ? advisorBase : base;
      fetch(entry, { cache: 'no-store' })
        .then((response) => {
          if (!response.ok) throw new Error('SPA entry request failed');
          return response.text();
        })
        .then((html) => {
          document.open();
          document.write(html);
          document.close();
        })
        .catch(() => {
          document.body.textContent = '페이지를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
        });
    </script>
  </body>
</html>
`
}

// 블로그 스위치가 닫혀 있으면 dist/mockups 의 블로그 목업을 지운다 (판단은 route-rules.mjs)
function checkBlogLineOpenAndCleanupMockups(distDirectory) {
  if (readBlogLineOpen()) {
    return
  }

  const mockupsDir = resolve(distDirectory, 'mockups')
  const deletedFiles = []

  for (const fileName of BLOG_MOCKUP_FILES) {
    const filePath = resolve(mockupsDir, fileName)
    if (existsSync(filePath)) {
      rmSync(filePath)
      deletedFiles.push(filePath)
    }
  }

  if (existsSync(mockupsDir)) {
    for (const fileName of readdirSync(mockupsDir)) {
      if (isBlogMockupFile(fileName)) {
        const filePath = resolve(mockupsDir, fileName)
        if (!deletedFiles.includes(filePath)) {
          rmSync(filePath)
          deletedFiles.push(filePath)
        }
      }
    }
  }

  if (deletedFiles.length > 0) {
    console.log('Blog line closed - deleted mockup files:')
    for (const file of deletedFiles) {
      console.log(`  ${file}`)
    }
  }
}

const args = readArguments(process.argv.slice(2))
const distDirectory = resolve(args.get('dist') || 'frontend/dist')
const advisorDistArgument = args.get('advisor-dist')
const base = args.get('base') || EXPECTED_BASE
const commitSha = args.get('sha') || process.env.GITHUB_SHA || 'local'
const builtAt = args.get('built-at') || new Date().toISOString()

if (base !== EXPECTED_BASE) {
  throw new Error(`Expected GitHub Pages base ${EXPECTED_BASE}, received ${base}.`)
}
if (!advisorDistArgument) {
  throw new Error('Advisor GitHub Pages output must be provided with --advisor-dist.')
}

// Clean up blog mockup files if blog line is closed
checkBlogLineOpenAndCleanupMockups(distDirectory)

const indexPath = resolve(distDirectory, 'index.html')
const { references, html: mainIndexHtml } = verifyIndex(indexPath, distDirectory, base, 'GitHub Pages')

const advisorDistDirectory = resolve(advisorDistArgument)
const advisorTargetDirectory = resolve(distDirectory, 'advisor')
if (advisorDistDirectory === advisorTargetDirectory) {
  throw new Error('Advisor source output must be outside the merged advisor target.')
}
const advisorBuild = verifyIndex(
  resolve(advisorDistDirectory, 'index.html'),
  advisorDistDirectory,
  EXPECTED_ADVISOR_BASE,
  'Advisor GitHub Pages',
)
rmSync(advisorTargetDirectory, { recursive: true, force: true })
cpSync(advisorDistDirectory, advisorTargetDirectory, { recursive: true })

const copiedAdvisor = verifyIndex(
  resolve(advisorTargetDirectory, 'index.html'),
  advisorTargetDirectory,
  EXPECTED_ADVISOR_BASE,
  'Merged advisor',
)
writeFileSync(resolve(advisorTargetDirectory, '404.html'), copiedAdvisor.html, 'utf8')
const fallbackHtml = createFallbackHtml(base, EXPECTED_ADVISOR_BASE)

// 복제 대상 경로 (route-rules.mjs 가 원천 파일에서 추출·제외 규칙 적용)
const pathsToCopy = copiedPaths()

// Create index.html copies for each path
const createdCopies = []
for (const path of pathsToCopy) {
  const targetDir = resolve(distDirectory, path.slice(1))  // Remove leading /
  const targetIndexPath = resolve(targetDir, 'index.html')

  // Create directory if it doesn't exist
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true })
  }

  // Determine which index.html to copy
  let sourceHtml = mainIndexHtml
  if (path.startsWith('/advisor')) {
    sourceHtml = copiedAdvisor.html
  }

  writeFileSync(targetIndexPath, sourceHtml, 'utf8')
  createdCopies.push(path)
}

writeFileSync(resolve(distDirectory, '404.html'), fallbackHtml, 'utf8')
writeFileSync(resolve(distDirectory, '.nojekyll'), '', 'utf8')
writeFileSync(
  resolve(distDirectory, 'deployment.json'),
  `${JSON.stringify({ commitSha, builtAt, base, advisorBase: EXPECTED_ADVISOR_BASE }, null, 2)}\n`,
  'utf8'
)

const writtenFallbackHtml = readFileSync(resolve(distDirectory, '404.html'), 'utf8')
if (!writtenFallbackHtml.includes(EXPECTED_ADVISOR_BASE)) {
  throw new Error('GitHub Pages fallback does not route advisor paths to the advisor entry.')
}
for (const reference of collectLocalReferences(writtenFallbackHtml)) {
  assertArtifactReference(reference, distDirectory, base)
}

console.log(`GitHub Pages artifact verified: ${distDirectory}`)
console.log(`Base path: ${base}`)
console.log(`Commit SHA: ${commitSha}`)
console.log(`Local references checked: ${references.length}`)
console.log(`Advisor references checked: ${advisorBuild.references.length}`)
console.log(`Index.html copies created: ${createdCopies.length}`)
if (createdCopies.length > 0) {
  console.log(`Copied paths: ${createdCopies.sort().join(', ')}`)
}
