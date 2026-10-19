import type { MarkdownIt } from 'markdown-it'
import mermaid from 'mermaid'
import type { MermaidConfig } from 'mermaid'

/**
 * 将 Mermaid 围栏保存为文本，待插入页面后使用新版异步 API 渲染。
 */
export default function MermaidPlugin(
  md: MarkdownIt,
  options: MermaidConfig = {},
) {
  mermaid.initialize({
    ...options,
    startOnLoad: false,
    securityLevel: 'strict',
    suppressErrorRendering: true,
  })
  const fence = md.renderer.rules.fence!
  md.renderer.rules.fence = (tokens, idx, config, env, self) => {
    if (tokens[idx].info.trim() !== 'mermaid') {
      return fence(tokens, idx, config, env, self)
    }
    return `<pre class="mermaid">${md.utils.escapeHtml(tokens[idx].content.trim())}</pre>`
  }
}

let diagramId = 0

/**
 * 渲染指定容器中的图表；解析失败时保留原始文本供用户查看。
 */
export async function renderMermaid(container: HTMLElement) {
  // 等待同步页面组装完成，确保 SVG 测量时节点已挂载。
  await Promise.resolve()
  const nodes = Array.from(
    container.querySelectorAll<HTMLElement>('pre.mermaid'),
  )
  if (!nodes.length) return
  for (const node of nodes) {
    if (
      ['rendering', 'ready', 'error'].includes(node.dataset.mermaidStatus ?? '')
    )
      continue
    const source = node.textContent ?? ''
    node.dataset.mermaidStatus = 'rendering'
    try {
      // 使用专用测量容器，不让 Mermaid 在失败时覆盖用户源码。
      const { svg, bindFunctions } = await mermaid.render(
        `md-reader-mermaid-${++diagramId}`,
        source,
      )
      node.innerHTML = svg
      node.dataset.processed = 'true'
      node.dataset.mermaidStatus = 'ready'
      bindFunctions?.(node)
    } catch (error) {
      const message = document.createElement('div')
      message.className = 'md-reader__mermaid-error'
      message.textContent = `Failed to render Mermaid diagram: ${error instanceof Error ? error.message : String(error)}`
      const code = document.createElement('code')
      code.textContent = source
      node.replaceChildren(message, code)
      node.dataset.mermaidStatus = 'error'
    }
  }
}
