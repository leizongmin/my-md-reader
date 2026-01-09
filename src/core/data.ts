import MD_PLUGINS from '@/config/md-plugins'
import PAGE_THEMES from '@/config/page-themes'
import i18n from '@/config/i18n'

export interface Data {
  enable?: boolean
  refresh?: boolean
  language?: string
  centered?: boolean
  pageWidth?: 'default' | 'full'
  mdPlugins?: typeof MD_PLUGINS
  pageTheme?: (typeof PAGE_THEMES)[0]
  hiddenSide?: boolean
  showLineNumbers?: boolean
}

export function getDefaultData(mergeData: Data = {}): Data {
  return {
    enable: true,
    refresh: false,
    centered: true,
    hiddenSide: false,
    showLineNumbers: false,
    pageWidth: 'default',
    language: i18n().locale,
    mdPlugins: [...MD_PLUGINS],
    pageTheme: PAGE_THEMES[0],
    ...mergeData,
  }
}
