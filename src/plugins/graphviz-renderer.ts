import { instance } from '@viz-js/viz'
import {
  decodeGraphvizSource,
  GRAPHVIZ_CLASS,
  GRAPHVIZ_CONTENT_CLASS,
  GRAPHVIZ_ERROR_CLASS,
  GRAPHVIZ_SOURCE_ATTR,
  GRAPHVIZ_STATUS_ATTR,
} from '../core/graphviz.ts'

let vizPromise: ReturnType<typeof instance> | null = null

/** 复用 WASM 实例；加载失败后允许下次重绘重试。 */
function getViz() {
  if (!vizPromise) {
    vizPromise = instance().catch(error => {
      vizPromise = null
      throw error
    })
  }
  return vizPromise
}

/** 将一个 DOT 占位符替换为 SVG，失败时保留源码并显示错误。 */
async function renderGraphvizElement(element: HTMLElement) {
  const status = element.getAttribute(GRAPHVIZ_STATUS_ATTR)
  if (status === 'rendering' || status === 'ready') return
  const source = element.getAttribute(GRAPHVIZ_SOURCE_ATTR)
  if (!source) return
  element.querySelector(`.${GRAPHVIZ_ERROR_CLASS}`)?.remove()
  element.setAttribute(GRAPHVIZ_STATUS_ATTR, 'rendering')
  try {
    const code = decodeGraphvizSource(source)
    const viz = await getViz()
    const svg = viz.renderSVGElement(code)
    svg.classList.add(`${GRAPHVIZ_CLASS}-svg`)
    element.querySelector(`.${GRAPHVIZ_CONTENT_CLASS}`)?.replaceWith(svg)
    element.setAttribute(GRAPHVIZ_STATUS_ATTR, 'ready')
  } catch (error) {
    const message = document.createElement('div')
    message.className = GRAPHVIZ_ERROR_CLASS
    message.textContent = error instanceof Error ? error.message : String(error)
    element.appendChild(message)
    element.setAttribute(GRAPHVIZ_STATUS_ATTR, 'error')
  }
}

/** 渲染容器中的 DOT 图表，跳过已经完成或正在渲染的节点。 */
export async function renderGraphviz(container: ParentNode) {
  await Promise.resolve()
  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(`.${GRAPHVIZ_CLASS}`),
  )
  await Promise.all(elements.map(renderGraphvizElement))
}
