import type MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token'
import { alert } from '@mdit/plugin-alert'
import mContainer from 'markdown-it-container'

/**
 * Alert 插件 - 支持多种提示块样式
 */
export default function AlertPlugin(md: MarkdownIt) {
  const customContainers = [
    [alert, { deep: true }],
    [
      mContainer,
      'note',
      {
        render(tokens: Token[], idx: number) {
          return tokens[idx].nesting === 1
            ? '<blockquote class="info">\n'
            : '</blockquote>\n'
        },
      },
    ],
    [
      mContainer,
      'info',
      {
        render(tokens: Token[], idx: number) {
          return tokens[idx].nesting === 1
            ? '<blockquote class="info">\n'
            : '</blockquote>\n'
        },
      },
    ],
    [
      mContainer,
      'tips',
      {
        render(tokens: Token[], idx: number) {
          return tokens[idx].nesting === 1
            ? '<blockquote class="tip">\n'
            : '</blockquote>\n'
        },
      },
    ],
    [
      mContainer,
      'tip',
      {
        render(tokens: Token[], idx: number) {
          return tokens[idx].nesting === 1
            ? '<blockquote class="tip">\n'
            : '</blockquote>\n'
        },
      },
    ],
    [
      mContainer,
      'success',
      {
        render(tokens: Token[], idx: number) {
          return tokens[idx].nesting === 1
            ? '<blockquote class="success">\n'
            : '</blockquote>\n'
        },
      },
    ],
    [
      mContainer,
      'warning',
      {
        render(tokens: Token[], idx: number) {
          return tokens[idx].nesting === 1
            ? '<blockquote class="warning">\n'
            : '</blockquote>\n'
        },
      },
    ],
    [
      mContainer,
      'danger',
      {
        render(tokens: Token[], idx: number) {
          return tokens[idx].nesting === 1
            ? '<blockquote class="danger">\n'
            : '</blockquote>\n'
        },
      },
    ],
  ]
  customContainers.forEach(p => {
    md.use(p[0] as MarkdownIt.PluginSimple, ...(p.slice(1) as unknown[]))
  })
}
