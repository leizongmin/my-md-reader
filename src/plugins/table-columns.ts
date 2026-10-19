const originalWidths = new WeakMap<HTMLTableCellElement, string>()

/** 缩小溢出表格的短列，合并单元格使用自身实际宽度而非行内索引。 */
export function fitTables(content: HTMLElement) {
  content.querySelectorAll('table').forEach(table => {
    const cells = Array.from(table.rows).flatMap(row => Array.from(row.cells))
    cells.forEach(cell => {
      if (!originalWidths.has(cell))
        originalWidths.set(cell, cell.style.minWidth)
      cell.style.minWidth = originalWidths.get(cell)!
    })
    if (table.scrollWidth <= table.clientWidth) return

    const whiteSpace = table.style.whiteSpace
    cells.forEach(cell => (cell.style.minWidth = '0'))
    table.style.whiteSpace = 'nowrap'
    // 浏览器已按 colspan/rowspan 对齐列，直接测量不会误用相邻列的宽度。
    const widths = cells.map(cell =>
      Math.ceil(cell.getBoundingClientRect().width),
    )
    table.style.whiteSpace = whiteSpace
    cells.forEach((cell, index) => {
      cell.style.minWidth = `min(${10 * cell.colSpan}rem, ${widths[index]}px)`
    })
  })
}

/** 合并布局变化，在重绘、窗口缩放和侧栏切换后重新适配表格。 */
export function observeTableColumns(content: HTMLElement) {
  let frame = 0
  const schedule = () => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => fitTables(content))
  }
  const observer = new ResizeObserver(schedule)
  observer.observe(content)
  if (content.parentElement) observer.observe(content.parentElement)
  const mutations = new MutationObserver(schedule)
  mutations.observe(content, { childList: true, subtree: true })
  window.addEventListener('resize', schedule)
  schedule()
  return () => {
    observer.disconnect()
    mutations.disconnect()
    window.removeEventListener('resize', schedule)
    cancelAnimationFrame(frame)
  }
}
