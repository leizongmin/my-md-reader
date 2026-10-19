import type { MarkdownIt, Token } from 'markdown-it'
import tableOfContents from 'markdown-it-table-of-contents'

/** 提取标题的可见文字，避免格式标记进入目录锚点。 */
function headingText(tokens: Token[]): string {
  return tokens
    .map(token => {
      if (token.type === 'image') return headingText(token.children ?? [])
      if (token.type === 'text' || token.type === 'code_inline')
        return token.content
      if (token.type === 'softbreak' || token.type === 'hardbreak') return ' '
      return ''
    })
    .join('')
    .trim()
}

/** 在生成目录前分配唯一标题 ID，让目录与两端侧栏使用同一锚点。 */
export default function TocPlugin(md: MarkdownIt) {
  md.core.ruler.push('md_reader_heading_ids', state => {
    const used = new Set<string>()
    state.tokens.forEach((token, index) => {
      if (token.type !== 'heading_open') return
      const text = headingText(state.tokens[index + 1].children ?? [])
      const base = encodeURIComponent(text.toLowerCase().replace(/\s+/g, '-'))
      let id = base
      let suffix = 1
      while (used.has(id)) id = `${base}-${suffix++}`
      used.add(id)
      token.attrSet('id', id)
    })
  })
  md.use(tableOfContents, {
    includeLevel: [2, 3],
    getTokensText: headingText,
  })
}
