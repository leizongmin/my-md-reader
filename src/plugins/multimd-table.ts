import type { MarkdownIt } from 'markdown-it'
import multimdTable from 'markdown-it-multimd-table'

/**
 * 为尚未适配 MarkdownIt 15 的表格插件提供旧版 assign 工具。
 */
export default function MultimdTablePlugin(md: MarkdownIt) {
  const utils = md.utils as typeof md.utils & { assign?: typeof Object.assign }
  // 插件仅在初始化选项时使用 assign，解析仍由原插件完成。
  const previous = utils.assign
  utils.assign = Object.assign
  try {
    multimdTable(md)
  } finally {
    if (previous) utils.assign = previous
    else delete utils.assign
  }
}
