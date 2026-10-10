/**
 * 转义 HTML 文本和属性值
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * 将文本安全序列化为内联脚本中的 JavaScript 字符串
 */
export function serializeForScript(value: string): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

/**
 * 为 HTML 文档注入本地资源基准地址
 */
export function wrapHtmlContent(htmlContent: string, baseUri: string): string {
  if (/<base\b[^>]*\bhref\s*=/i.test(htmlContent)) {
    return htmlContent
  }

  const baseTag = `<base href="${baseUri}/">`
  const headPattern = /<head(?:\s[^>]*)?>/i

  if (headPattern.test(htmlContent)) {
    return htmlContent.replace(headPattern, match => `${match}\n  ${baseTag}`)
  }

  const htmlPattern = /<html(?:\s[^>]*)?>/i
  if (htmlPattern.test(htmlContent)) {
    return htmlContent.replace(
      htmlPattern,
      match => `${match}\n<head>\n  ${baseTag}\n</head>`,
    )
  }

  return `<!DOCTYPE html>\n<html>\n<head>\n  ${baseTag}\n</head>\n<body>\n${htmlContent}\n</body>\n</html>`
}
