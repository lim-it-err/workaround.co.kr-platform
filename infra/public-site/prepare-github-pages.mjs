import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const EXPECTED_BASE = '/workaround.co.kr-platform/'
const EXPECTED_ADVISOR_BASE = `${EXPECTED_BASE}advisor/`
const LOCAL_REFERENCE_PATTERN = /\b(?:href|src)=(['"])(.*?)\1/gi
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const projectRoot = resolve(__dirname, '../../')

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

function extractMainRoutePaths() {
  const staticRoutingPath = resolve(projectRoot, 'frontend/src/staticRouting.js')
  const content = readFileSync(staticRoutingPath, 'utf8')

  // Extract LIVE_PAGE_PATHS object
  const match = content.match(/const LIVE_PAGE_PATHS = \{([\s\S]*?)\}/)
  if (!match) {
    throw new Error('Cannot find LIVE_PAGE_PATHS in staticRouting.js')
  }

  const paths = []
  const pathsContent = match[1]
  // Match lines like: key: '/path',
  for (const line of pathsContent.split('\n')) {
    const pathMatch = line.match(/:\s*['"]([^'"]+)['"]/)
    if (pathMatch) {
      paths.push(pathMatch[1])
    }
  }

  return paths
}

function extractAdvisorRoutePaths() {
  const routesPath = resolve(projectRoot, 'services/advisor/frontend/src/modules/missions/routes.js')
  const content = readFileSync(routesPath, 'utf8')

  // Extract top-level route paths from missionRoutes
  const paths = new Set()

  // Match route definitions with path property
  const routeMatches = content.matchAll(/path:\s*['"]([^'"]+)['"]/g)
  for (const match of routeMatches) {
    const path = match[1]
    // Only include top-level paths (no params or deep nesting)
    if (!path.includes(':') && !path.includes('/')) {
      paths.add(`/${path}`)
    } else if (path.startsWith('/') && !path.slice(1).includes('/')) {
      // Include paths like '/today', '/learn' but not '/courses/:courseId/sim/:missionId'
      if (!path.includes(':')) {
        paths.add(path)
      }
    }
  }

  return Array.from(paths)
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

// Extract route paths from source files (single source of truth)
const mainPaths = extractMainRoutePaths()
const advisorPaths = extractAdvisorRoutePaths()

// Determine which paths should have index.html copies
// Skip: root (/), blog paths (/blog, /blog-district), /studio (writing), /runtime, /ets2/dev
const pathsToCopy = new Set()

for (const path of mainPaths) {
  // Skip protected and offline paths
  if (
    path === '/' ||
    path === '' ||
    path.startsWith('/blog') ||  // Both /blog and /blog-district
    path === '/studio' ||
    path === '/runtime' ||
    path === '/ets2/dev'
  ) {
    continue
  }
  pathsToCopy.add(path)
}

// Add Advisor paths (these go under /advisor/)
for (const path of advisorPaths) {
  pathsToCopy.add(`/advisor${path}`)
}

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
