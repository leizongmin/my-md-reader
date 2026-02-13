import throttle from 'lodash.throttle'
import { initMarkdownRenderer, mdRender } from './markdown'
import './style.less'

declare global {
  interface Window {
    initialConfig: PreviewConfig
  }
}

interface PreviewConfig {
  pageTheme: 'light' | 'dark' | 'auto'
  pageWidth: 'default' | 'full'
  centered: boolean
  showLineNumbers: boolean
  hiddenSide: boolean
  mdPlugins: string[]
  fontSize: number
}

interface VscodeApi {
  postMessage(message: unknown): void
  getState(): unknown
  setState(state: unknown): void
}

declare function acquireVsCodeApi(): VscodeApi

const vscode = acquireVsCodeApi()
let config: PreviewConfig = window.initialConfig
let currentContent = ''
let currentBaseUri = ''
let headElements: HTMLElement[] = []
let sideLiElements: HTMLElement[] = []
let targetIndex: number | null = null
let isSideHover = false

const PREFIX = 'md-reader__'
const className = {
  PREFIX,
  MD_BODY: `${PREFIX}body`,
  MD_SIDE: `${PREFIX}side`,
  MD_SIDE_ACTIVE: `${PREFIX}side-li--active`,
  MD_CONTENT: `${PREFIX}markdown-content`,
  MD_BUTTON: `${PREFIX}btn`,
  HEAD_ANCHOR: `${PREFIX}head-anchor`,
  BUTTON_WRAP_ELE: `${PREFIX}button-wrap`,
  SIDE_EXPAND_BTN: `${PREFIX}btn--side-expand`,
  GO_TOP_BTN: `${PREFIX}btn--go-top`,
  COPY_BTN: `${PREFIX}btn--copy`,
  SIDE_COLLAPSED: 'side-collapsed',
  SIDE_EXPANDED: 'side-expanded',
  MODAL: `${PREFIX}modal`,
  ZOOM_IMAGE: `${PREFIX}zoom-image`,
}

const copyIconSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.24162C20 6.7034 19.7831 6.18789 19.3982 5.81161L16.0829 2.56999C15.7092 2.2046 15.2074 2 14.6847 2H10C8.89543 2 8 2.89543 8 4Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 18V20C16 21.1046 15.1046 22 14 22H6C4.89543 22 4 21.1046 4 20V9C4 7.89543 4.89543 7 6 7H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`

const successIconSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 13L9 17L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`

const sideIconSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 3H4C3.44772 3 3 3.44772 3 4V20C3 20.5523 3.44772 21 4 21H9M9 3V21M9 3H20C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H9" stroke="currentColor" stroke-width="1.5"/></svg>`

const goTopIconSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`

function init() {
  const body = document.body
  body.innerHTML = ''

  setTheme(config.pageTheme)
  setFontSize(config.fontSize || 14)

  const shouldHideSide = config.hiddenSide
  body.classList.toggle(className.SIDE_COLLAPSED, shouldHideSide)

  const mdContent = document.createElement('article')
  mdContent.className = `${className.MD_CONTENT} ${
    config.centered ? 'centered' : ''
  }`

  const mdBody = document.createElement('main')
  mdBody.className = className.MD_BODY
  mdBody.appendChild(mdContent)

  const mdSide = document.createElement('ul')
  mdSide.className = className.MD_SIDE
  mdSide.addEventListener('mouseenter', () => {
    isSideHover = true
  })
  mdSide.addEventListener('mouseleave', () => {
    isSideHover = false
  })

  const sideExpandBtn = createButton(
    [className.MD_BUTTON, className.SIDE_EXPAND_BTN],
    'Toggle sidebar',
    sideIconSvg,
  )
  sideExpandBtn.addEventListener('click', () => {
    onToggleSide(mdBody, mdSide)
  })

  const goTopBtn = createButton(
    [className.MD_BUTTON, className.GO_TOP_BTN],
    'Go to top',
    goTopIconSvg,
  )
  goTopBtn.style.display = 'none'
  goTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })

  const buttonWrap = document.createElement('div')
  buttonWrap.className = className.BUTTON_WRAP_ELE
  buttonWrap.appendChild(sideExpandBtn)
  buttonWrap.appendChild(goTopBtn)

  body.appendChild(buttonWrap)
  body.appendChild(mdBody)
  body.appendChild(mdSide)

  mdContent.addEventListener('click', e => {
    const target = e.target as HTMLElement
    handleContentClick(target)
  })

  document.addEventListener(
    'scroll',
    throttle(() => onScroll(goTopBtn), 100),
  )

  window.addEventListener('message', event => {
    const message = event.data
    switch (message.command) {
      case 'update':
        currentContent = message.content
        currentBaseUri = message.baseUri || ''
        renderContent(mdContent, message.content)
        resolveResourcePaths(mdContent, currentBaseUri)
        renderSide(mdContent, mdSide)
        break
      case 'updateConfig':
        config = message.config
        applyConfig(mdContent, mdSide)
        break
    }
  })
}

function createButton(
  classNames: string[],
  title: string,
  iconSvg: string,
): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.className = classNames.join(' ')
  btn.title = title
  btn.innerHTML = iconSvg
  return btn
}

function setTheme(theme: 'light' | 'dark' | 'auto') {
  const html = document.documentElement
  html.dataset.mdReaderTheme = theme === 'auto' ? getSystemTheme() : theme
}

function setFontSize(fontSize: number) {
  document.documentElement.style.setProperty(
    '--md-reader-font-size',
    `${fontSize}px`,
  )
}

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function renderContent(container: HTMLElement, content: string) {
  initMarkdownRenderer({
    theme: config.pageTheme === 'auto' ? getSystemTheme() : config.pageTheme,
    plugins: config.mdPlugins,
    showLineNumbers: config.showLineNumbers,
  })

  const html = mdRender(content)
  container.innerHTML = html

  container.querySelectorAll('pre.hljs-pre').forEach(pre => {
    addCopyButton(pre as HTMLElement)
  })
}

function resolveResourcePaths(container: HTMLElement, baseUri: string) {
  if (!baseUri) return

  const baseUrl = baseUri.endsWith('/') ? baseUri : baseUri + '/'

  container.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src')
    if (src && isRelativePath(src)) {
      img.src = baseUrl + src
    }
  })

  container.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href')
    if (href && isRelativePath(href) && !href.startsWith('#')) {
      a.href = baseUrl + href
    }
  })

  container.querySelectorAll('video source, audio source').forEach(source => {
    const src = source.getAttribute('src')
    if (src && isRelativePath(src)) {
      source.setAttribute('src', baseUrl + src)
    }
  })
}

function isRelativePath(path: string): boolean {
  if (!path) return false
  if (path.startsWith('http://') || path.startsWith('https://')) return false
  if (path.startsWith('data:')) return false
  if (path.startsWith('vscode-webview://')) return false
  if (path.startsWith('/')) return false
  return true
}

function addCopyButton(preElement: HTMLElement) {
  const existingBtn = preElement.querySelector(`.${className.COPY_BTN}`)
  if (existingBtn) return

  const codeElement = preElement.querySelector('code')
  if (!codeElement) return

  const copyBtn = document.createElement('button')
  copyBtn.className = `${className.MD_BUTTON} ${className.COPY_BTN}`
  copyBtn.title = 'Copy'
  copyBtn.innerHTML = `
    <span class="icon-copy">${copyIconSvg}</span>
    <span class="icon-success">${successIconSvg}</span>
  `

  copyBtn.addEventListener('click', () => {
    const code = codeElement.textContent || ''
    vscode.postMessage({ command: 'copy', text: code })

    copyBtn.classList.add('copied')
    setTimeout(() => {
      copyBtn.classList.remove('copied')
    }, 1500)
  })

  preElement.appendChild(copyBtn)
}

function renderSide(contentContainer: HTMLElement, sideContainer: HTMLElement) {
  const idCache: Record<string, number> = Object.create(null)
  headElements = Array.from(
    contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6'),
  ) as HTMLElement[]
  sideLiElements = []
  sideContainer.innerHTML = ''

  headElements.forEach(head => {
    const content = (head.textContent || '').trim()
    const encodeContent = getDecodeContent(content, idCache)

    head.setAttribute('id', encodeContent)

    const existingAnchor = head.querySelector(`.${className.HEAD_ANCHOR}`)
    if (!existingAnchor) {
      const headAnchor = document.createElement('a')
      headAnchor.className = className.HEAD_ANCHOR
      headAnchor.href = `#${encodeContent}`
      headAnchor.textContent = '#'
      head.insertBefore(headAnchor, head.firstChild)
    }

    const link = document.createElement('a')
    link.title = content
    link.href = `#${encodeContent}`
    link.textContent = content

    const li = document.createElement('li')
    li.className = `${className.MD_SIDE}-${head.tagName.toLowerCase()}`
    li.appendChild(link)
    sideLiElements.push(li)
    sideContainer.appendChild(li)
  })

  setTimeout(
    () =>
      onScroll(
        document.querySelector(`.${className.GO_TOP_BTN}`) as HTMLElement,
      ),
    0,
  )
}

function getDecodeContent(
  content: string,
  idCache: Record<string, number>,
): string {
  const key = encodeURIComponent(content.toLowerCase().replace(/\s+/g, '-'))
  if (key in idCache) {
    return `${key}-${idCache[key]++}`
  } else {
    idCache[key] = 1
    return key
  }
}

function onScroll(goTopBtn: HTMLElement | null) {
  const documentScrollTop = document.documentElement.scrollTop

  if (goTopBtn) {
    goTopBtn.style.display = documentScrollTop >= 640 ? 'block' : 'none'
  }

  headElements.some((_, index) => {
    let sectionHeight = -20
    const item = headElements[index + 1]
    if (item) {
      sectionHeight += item.offsetTop
    }

    const hit = sectionHeight <= 0 || sectionHeight > documentScrollTop

    if (hit && targetIndex !== index) {
      if (targetIndex !== null) {
        const prevTarget = sideLiElements[targetIndex]
        if (prevTarget) {
          prevTarget.classList.remove(className.MD_SIDE_ACTIVE)
        }
      }

      const target = sideLiElements[index]
      if (target) {
        target.classList.add(className.MD_SIDE_ACTIVE)
        if (!isSideHover && target.scrollIntoView) {
          target.scrollIntoView({ block: 'nearest' })
        }
      }
      targetIndex = index
    }
    return hit
  })
}

function onToggleSide(mdBody: HTMLElement, mdSide: HTMLElement) {
  const body = document.body
  if (window.innerWidth <= 960) {
    const isExpanded = body.classList.toggle(className.SIDE_EXPANDED)
    if (isExpanded) {
      const foldSide = (e: Event) => {
        if (e.type === 'keydown' && (e as KeyboardEvent).code !== 'Escape') {
          return
        }
        body.classList.remove(className.SIDE_EXPANDED)
        mdBody.removeEventListener('click', foldSide)
        window.removeEventListener('resize', foldSide)
        document.removeEventListener('keydown', foldSide)
        e.stopPropagation()
        e.preventDefault()
      }
      setTimeout(() => {
        mdBody.addEventListener('click', foldSide, { once: true })
        window.addEventListener('resize', foldSide, { once: true })
        document.addEventListener('keydown', foldSide, { once: true })
      }, 0)
    }
  } else {
    config.hiddenSide = body.classList.toggle(className.SIDE_COLLAPSED)
  }
}

function applyConfig(mdContent: HTMLElement, mdSide: HTMLElement) {
  const body = document.body

  setTheme(config.pageTheme)
  setFontSize(config.fontSize || 14)

  mdContent.classList.toggle('centered', config.centered)

  body.classList.toggle(className.SIDE_COLLAPSED, config.hiddenSide)

  if (currentContent) {
    renderContent(mdContent, currentContent)
    renderSide(mdContent, mdSide)
  }
}

function handleContentClick(target: HTMLElement) {
  if (target.tagName === 'IMG' && !target.classList.contains('equation')) {
    openImageViewer(target as HTMLImageElement)
  }

  if (target.tagName === 'A') {
    const href = target.getAttribute('href')
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      vscode.postMessage({ command: 'openLink', href })
    }
  }
}

function openImageViewer(img: HTMLImageElement) {
  const existingModal = document.querySelector(`.${className.MODAL}`)
  if (existingModal) {
    existingModal.remove()
  }

  const modal = document.createElement('div')
  modal.className = className.MODAL

  const zoomImg = document.createElement('img')
  zoomImg.className = className.ZOOM_IMAGE
  zoomImg.src = img.src
  zoomImg.alt = img.alt

  const rect = img.getBoundingClientRect()
  zoomImg.style.width = `${rect.width}px`
  zoomImg.style.height = `${rect.height}px`
  zoomImg.style.transform = `translate(${rect.left}px, ${rect.top}px)`

  modal.appendChild(zoomImg)
  document.body.appendChild(modal)

  requestAnimationFrame(() => {
    modal.classList.add('opened')

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const imgNaturalWidth = img.naturalWidth || rect.width
    const imgNaturalHeight = img.naturalHeight || rect.height

    const maxWidth = viewportWidth * 0.9
    const maxHeight = viewportHeight * 0.9
    const scale = Math.min(
      maxWidth / imgNaturalWidth,
      maxHeight / imgNaturalHeight,
      1,
    )

    const finalWidth = imgNaturalWidth * scale
    const finalHeight = imgNaturalHeight * scale
    const finalX = (viewportWidth - finalWidth) / 2
    const finalY = (viewportHeight - finalHeight) / 2

    zoomImg.style.width = `${finalWidth}px`
    zoomImg.style.height = `${finalHeight}px`
    zoomImg.style.transform = `translate(${finalX}px, ${finalY}px)`
  })

  modal.addEventListener('click', () => {
    const rect = img.getBoundingClientRect()
    zoomImg.style.width = `${rect.width}px`
    zoomImg.style.height = `${rect.height}px`
    zoomImg.style.transform = `translate(${rect.left}px, ${rect.top}px)`
    modal.classList.remove('opened')

    setTimeout(() => {
      modal.remove()
    }, 300)
  })
}

window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', () => {
    if (config.pageTheme === 'auto') {
      setTheme('auto')
      const mdContent = document.querySelector(
        `.${className.MD_CONTENT}`,
      ) as HTMLElement
      const mdSide = document.querySelector(
        `.${className.MD_SIDE}`,
      ) as HTMLElement
      if (mdContent && currentContent) {
        renderContent(mdContent, currentContent)
        renderSide(mdContent, mdSide)
      }
    }
  })

init()
