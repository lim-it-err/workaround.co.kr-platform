// TKT-210: App.vue 에서 떼어낸 블로그 마크다운 렌더러·슬러그·Studio 표 정규화(순수 함수 — 상태 없음). 동작은 그대로다.

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function renderMarkdownToHtml(markdown, tables = []) {
  const lines = escapeHtml(String(markdown || '')).replace(/\r\n/g, '\n').split('\n')
  const html = []
  const studioTables = new Map(normalizeStudioTables(tables).map((table) => [table.id, table]))
  let inCode = false

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (line.startsWith('```')) {
      html.push(inCode ? '</code></pre>' : '<pre class="post-code"><code>')
      inCode = !inCode
      continue
    }

    if (inCode) {
      html.push(`${line}\n`)
      continue
    }

    if (!line.trim()) {
      continue
    }

    const studioTable = studioTables.get(parseStudioTableMarker(line))
    if (studioTable) {
      html.push(renderStudioTable(studioTable))
      continue
    }

    const listItem = parseMarkdownListItem(line)
    if (listItem) {
      const renderedList = renderMarkdownList(lines, index, listItem.indent, listItem.type)
      html.push(renderedList.html)
      index = renderedList.nextIndex - 1
      continue
    }

    if (line.startsWith('### ')) {
      html.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`)
      continue
    }

    if (line.startsWith('## ')) {
      html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`)
      continue
    }

    if (line.startsWith('# ')) {
      html.push(`<h1>${inlineMarkdown(line.slice(2))}</h1>`)
      continue
    }

    if (line.startsWith('> ')) {
      const quoteLines = [line.slice(2)]
      while (lines[index + 1]?.startsWith('> ')) {
        index += 1
        quoteLines.push(lines[index].slice(2))
      }
      html.push(`<blockquote>${inlineMarkdown(quoteLines.join(' '))}</blockquote>`)
      continue
    }

    const paragraphLines = [line.trim()]
    while (lines[index + 1]?.trim() && !isMarkdownBlockStart(lines[index + 1])) {
      index += 1
      paragraphLines.push(lines[index].trim())
    }
    html.push(`<p>${inlineMarkdown(paragraphLines.join(' '))}</p>`)
  }
  if (inCode) {
    html.push('</code></pre>')
  }

  return html.join('')
}

function parseMarkdownListItem(line) {
  const match = line.replace(/\t/g, '    ').match(/^(\s*)([-+*]|\d+\.)\s+(.+)$/)
  if (!match) {
    return null
  }
  return {
    indent: match[1].length,
    type: /\d+\./.test(match[2]) ? 'ol' : 'ul',
    content: match[3]
  }
}

function renderMarkdownList(lines, startIndex, baseIndent, listType) {
  const html = [`<${listType}>`]
  let index = startIndex

  while (index < lines.length) {
    const item = parseMarkdownListItem(lines[index])
    if (!item || item.indent !== baseIndent || item.type !== listType) {
      break
    }

    html.push(`<li>${inlineMarkdown(item.content)}`)
    index += 1

    while (index < lines.length) {
      const child = parseMarkdownListItem(lines[index])
      if (!child || child.indent <= baseIndent) {
        break
      }
      const renderedChild = renderMarkdownList(lines, index, child.indent, child.type)
      html.push(renderedChild.html)
      index = renderedChild.nextIndex
    }

    html.push('</li>')
  }

  html.push(`</${listType}>`)
  return { html: html.join(''), nextIndex: index }
}

function isMarkdownBlockStart(line) {
  return (
    line.startsWith('```') ||
    /^(#{1,3})\s/.test(line) ||
    line.startsWith('> ') ||
    Boolean(parseMarkdownListItem(line)) ||
    Boolean(parseStudioTableMarker(line))
  )
}

export function normalizeStudioTables(tables) {
  if (!Array.isArray(tables)) {
    return []
  }
  return tables
    .filter((table) => table && /^[a-z0-9-]+$/i.test(String(table.id || '')))
    .map((table, tableIndex) => {
      const headers = Array.isArray(table.headers) && table.headers.length > 0
        ? table.headers.map((value, columnIndex) => String(value || `열 ${columnIndex + 1}`))
        : ['열 1']
      const rows = Array.isArray(table.rows) && table.rows.length > 0
        ? table.rows.map((row) => headers.map((_, columnIndex) => String(row?.[columnIndex] || '')))
        : [headers.map(() => '')]
      return {
        id: String(table.id),
        caption: String(table.caption || `표 ${tableIndex + 1}`),
        headers,
        rows
      }
    })
}

function parseStudioTableMarker(line) {
  return String(line || '').trim().match(/^\[\[studio-table:([a-z0-9-]+)\]\]$/i)?.[1] || ''
}

function renderStudioTable(table) {
  const caption = inlineMarkdown(escapeHtml(table.caption))
  const head = table.headers
    .map((cell) => `<th scope="col">${inlineMarkdown(escapeHtml(cell))}</th>`)
    .join('')
  const body = table.rows
    .map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(escapeHtml(cell))}</td>`).join('')}</tr>`)
    .join('')
  return `<figure class="studio-table"><figcaption>${caption}</figcaption><div class="studio-table-scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div></figure>`
}

function inlineMarkdown(text) {
  const protectedTokens = []
  const protect = (value) => {
    const token = `\u0000${protectedTokens.length}\u0000`
    protectedTokens.push(value)
    return token
  }

  let rendered = String(text || '').replace(/`([^`\n]+)`/g, (_, code) => protect(`<code>${code}</code>`))

  rendered = rendered.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, url) => {
    const safeUrl = allowedMarkdownImageUrl(url)
    if (!safeUrl) {
      return alt
    }
    const safeAlt = alt.replace(/[*_`]/g, '')
    return protect(`<img src="${safeUrl}" alt="${safeAlt}" loading="lazy">`)
  })

  rendered = rendered.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
    const safeUrl = allowedMarkdownUrl(url, ['http:', 'https:', 'mailto:'])
    if (!safeUrl) {
      return label
    }
    return protect(`<a href="${safeUrl}" rel="noopener noreferrer">${formatInlineMarkdown(label)}</a>`)
  })

  rendered = formatInlineMarkdown(rendered)
  return rendered.replace(/\u0000(\d+)\u0000/g, (_, index) => protectedTokens[Number(index)] || '')
}

function formatInlineMarkdown(text) {
  return text
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
}

function allowedMarkdownUrl(value, allowedProtocols) {
  const candidate = String(value || '').trim()
  try {
    const parsed = new URL(candidate)
    return allowedProtocols.includes(parsed.protocol) ? candidate : ''
  } catch (error) {
    return ''
  }
}

function allowedMarkdownImageUrl(value) {
  const candidate = String(value || '').trim()
  if (
    candidate.length <= 2_100_000 &&
    /^data:image\/(?:png|jpeg|gif|webp|avif);base64,[a-z0-9+/]+={0,2}$/i.test(candidate)
  ) {
    return candidate
  }
  return allowedMarkdownUrl(candidate, ['http:', 'https:'])
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
