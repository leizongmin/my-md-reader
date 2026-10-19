const GRAPHVIZ_INFO_TOKENS = new Set(['digraph', 'dot', 'graphviz'])
const GRAPHVIZ_SOURCE_PREFIX =
  /^(?:strict\s+)?(?:di)?graph\b(?:\s+["\w.-]+)?\s*\{/i

export const GRAPHVIZ_CLASS = 'md-reader__graphviz'
export const GRAPHVIZ_CONTENT_CLASS = `${GRAPHVIZ_CLASS}-content`
export const GRAPHVIZ_ERROR_CLASS = `${GRAPHVIZ_CLASS}-error`
export const GRAPHVIZ_SOURCE_ATTR = 'data-graphviz-source'
export const GRAPHVIZ_STATUS_ATTR = 'data-graphviz-status'

/** 识别 DOT 围栏以及误标为 Mermaid 的 DOT 源码。 */
export function isGraphvizCodeBlock(info = '', code = ''): boolean {
  const token = info.trim().toLowerCase()
  return (
    GRAPHVIZ_INFO_TOKENS.has(token) ||
    (token === 'mermaid' && GRAPHVIZ_SOURCE_PREFIX.test(code.trimStart()))
  )
}

/** 使用 UTF-8 保存源码，避免属性注入并支持中文标签。 */
export function encodeGraphvizSource(code: string): string {
  return btoa(
    Array.from(new TextEncoder().encode(code), byte =>
      String.fromCharCode(byte),
    ).join(''),
  )
}

/** 还原属性中保存的 DOT 源码。 */
export function decodeGraphvizSource(value: string): string {
  return new TextDecoder().decode(
    Uint8Array.from(atob(value), char => char.charCodeAt(0)),
  )
}

/** 渲染可读的源码占位符，异步成功后替换为图表。 */
export function renderGraphvizPlaceholder(code: string): string {
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
  return `<pre class="${GRAPHVIZ_CLASS}" ${GRAPHVIZ_SOURCE_ATTR}="${encodeGraphvizSource(code)}" ${GRAPHVIZ_STATUS_ATTR}="pending"><code class="${GRAPHVIZ_CONTENT_CLASS}">${escaped}</code></pre>`
}
