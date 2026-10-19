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
  })
  const fence = md.renderer.rules.fence!
  md.renderer.rules.fence = (tokens, idx, config, env, self) => {
    if (tokens[idx].info.trim() !== 'mermaid') {
      return fence(tokens, idx, config, env, self)
    }
    return `<pre class="mermaid">${md.utils.escapeHtml(tokens[idx].content.trim())}</pre>`
  }
}

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
  try {
    await mermaid.run({ nodes, suppressErrors: true })
  } catch (error) {
    console.error('Failed to render Mermaid diagrams', error)
  }
}
