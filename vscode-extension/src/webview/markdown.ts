import hljs from 'highlight.js'
import MarkdownIt from 'markdown-it'
import mSub from 'markdown-it-sub'
import mSup from 'markdown-it-sup'
import mIns from 'markdown-it-ins'
import mAbbr from 'markdown-it-abbr'
import mMark from 'markdown-it-mark'
import mEmoji from 'markdown-it-emoji'
import mDeflist from 'markdown-it-deflist'
import mFootnote from 'markdown-it-footnote'
import mTaskLists from 'markdown-it-task-lists'
import mToc from 'markdown-it-table-of-contents'
import mKatex from '@traptitech/markdown-it-katex'
import mMermaid from '@md-reader/markdown-it-mermaid'
import mMultimdTable from 'markdown-it-multimd-table'
import mAlert from './alert'

export interface MdOptions {
  theme?: 'light' | 'dark'
  plugins?: string[]
  showLineNumbers?: boolean
}

type PluginConfig = { [p: string]: ((a: MdOptions) => unknown[]) | unknown[] }

const PLUGINS: PluginConfig = {
  Emoji: [mEmoji],
  Sub: [mSub],
  Sup: [mSup],
  Ins: [mIns],
  Abbr: [mAbbr],
  Katex: [mKatex],
  Mermaid: ({ theme }) => [
    mMermaid,
    { theme: theme === 'dark' ? 'dark' : 'default', themeVariables: undefined },
  ],
  Mark: [mMark],
  Deflist: [mDeflist],
  Footnote: [mFootnote],
  TaskLists: [mTaskLists],
  TOC: [mToc],
  Alert: [mAlert],
}

const DEFAULT_PLUGINS = [
  'Emoji',
  'Sub',
  'Sup',
  'Ins',
  'Abbr',
  'Katex',
  'Mermaid',
  'Mark',
  'Deflist',
  'Footnote',
  'TaskLists',
  'TOC',
  'Alert',
]

let md: MarkdownIt | null = null

/**
 * 初始化 Markdown 渲染器
 */
export function initMarkdownRenderer(options: MdOptions = {}): MarkdownIt {
  const {
    theme = 'light',
    plugins = DEFAULT_PLUGINS,
    showLineNumbers = false,
  } = options

  md = new MarkdownIt({
    html: true,
    breaks: false,
    linkify: true,
    xhtmlOut: true,
    typographer: true,
  })

  md.options.highlight = function (str: string, language: string) {
    let highlightedCode: string
    if (language && hljs.getLanguage(language)) {
      try {
        highlightedCode = hljs.highlight(str, {
          language,
          ignoreIllegals: true,
        }).value
      } catch (err) {
        console.error(err)
        highlightedCode = md!.utils.escapeHtml(str)
      }
    } else {
      highlightedCode = md!.utils.escapeHtml(str)
    }

    let lineNumbersHtml = ''
    let preClass = 'hljs-pre md-reader__code-block'
    if (showLineNumbers) {
      const lines = str.split('\n')
      const lineCount =
        lines.length > 0 && lines[lines.length - 1] === ''
          ? lines.length - 1
          : lines.length
      lineNumbersHtml = '<div class="hljs-line-numbers">'
      for (let i = 1; i <= lineCount; i++) {
        lineNumbersHtml += `<span>${i}</span>`
      }
      lineNumbersHtml += '</div>'
      preClass += ' has-line-numbers'
    }

    return `<pre class="${preClass}">${lineNumbersHtml}<code class="hljs" lang="${language}">${highlightedCode}</code></pre>`
  }

  md.linkify.set({
    fuzzyLink: false,
    fuzzyEmail: true,
  })

  const defaultValidateLink = md.validateLink.bind(md)
  md.validateLink = function (url: string) {
    if (url.toLowerCase().startsWith('file://')) {
      return true
    }
    return defaultValidateLink(url)
  }

  md.use(mMultimdTable)

  plugins.forEach(name => {
    let plugin = PLUGINS[name]
    if (typeof plugin === 'function') {
      plugin = plugin({ theme, plugins, showLineNumbers })
    }
    if (plugin) {
      md!.use(
        plugin[0] as MarkdownIt.PluginSimple,
        ...(plugin.slice(1) as unknown[]),
      )
    }
  })

  return md
}

/**
 * 移除 frontmatter
 */
function removeFrontmatter(content: string): string {
  const frontmatterRegex = /^---[\s\S]+?---\n/
  return content.replace(frontmatterRegex, '')
}

/**
 * 渲染 Markdown 内容
 */
export function mdRender(code: string): string {
  if (!md) {
    md = initMarkdownRenderer()
  }
  const filteredCode = removeFrontmatter(code)
  return md.render(filteredCode)
}
