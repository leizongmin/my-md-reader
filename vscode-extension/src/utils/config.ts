import * as vscode from 'vscode'

/**
 * 预览配置接口
 */
export interface PreviewConfig {
  pageTheme: 'light' | 'dark' | 'auto'
  pageWidth: 'default' | 'full'
  centered: boolean
  showLineNumbers: boolean
  hiddenSide: boolean
  mdPlugins: string[]
  fontSize: number
}

/**
 * 默认 Markdown 插件列表
 */
export const DEFAULT_MD_PLUGINS = [
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

/**
 * 获取插件配置
 */
export function getConfiguration(): PreviewConfig {
  const config = vscode.workspace.getConfiguration('myMdReader')

  return {
    pageTheme: config.get<'light' | 'dark' | 'auto'>('pageTheme', 'auto'),
    pageWidth: config.get<'default' | 'full'>('pageWidth', 'default'),
    centered: config.get<boolean>('centered', false),
    showLineNumbers: config.get<boolean>('showLineNumbers', false),
    hiddenSide: config.get<boolean>('hiddenSide', false),
    mdPlugins: config.get<string[]>('mdPlugins', DEFAULT_MD_PLUGINS),
    fontSize: config.get<number>('fontSize', 14),
  }
}

/**
 * 根据 VSCode 当前主题获取实际主题值
 */
export function getActualTheme(
  theme: 'light' | 'dark' | 'auto',
): 'light' | 'dark' {
  if (theme === 'auto') {
    const vsCodeTheme = vscode.window.activeColorTheme.kind
    return vsCodeTheme === vscode.ColorThemeKind.Dark ||
      vsCodeTheme === vscode.ColorThemeKind.HighContrast
      ? 'dark'
      : 'light'
  }
  return theme
}
