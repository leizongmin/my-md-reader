import type { MarkdownIt } from 'markdown-it'
import {
  isGraphvizCodeBlock,
  renderGraphvizPlaceholder,
} from '../core/graphviz.ts'

/** 在 Mermaid 插件之后接管 DOT 围栏，其余围栏沿用原渲染器。 */
export default function GraphvizBlockPlugin(md: MarkdownIt) {
  const fence = md.renderer.rules.fence!
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    if (isGraphvizCodeBlock(token.info, token.content)) {
      return renderGraphvizPlaceholder(token.content.trim())
    }
    return fence(tokens, idx, options, env, self)
  }
}
