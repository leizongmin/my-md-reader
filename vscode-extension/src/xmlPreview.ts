import * as path from 'path'
import * as vscode from 'vscode'
import { escapeHtml, serializeForScript } from './utils/html'
import {
  getDocumentKey,
  getErrorMessage,
  readDocumentText,
  watchDocument,
} from './utils/previewDocument'

/**
 * XML 预览面板管理类
 * 以浏览器风格的可折叠树展示 XML 内容
 */
export class XmlPreviewPanel {
  private static readonly panels: Map<string, XmlPreviewPanel> = new Map()
  public static readonly viewType = 'myMdReader.xmlPreview'

  private readonly _panel: vscode.WebviewPanel
  private readonly _documentKey: string
  private _document: vscode.TextDocument
  private _disposables: vscode.Disposable[] = []

  /**
   * 创建或显示 XML 预览面板
   */
  public static createOrShow(document: vscode.TextDocument) {
    const column = vscode.ViewColumn.Active
    const documentKey = getDocumentKey(document.uri)
    const existingPanel = XmlPreviewPanel.panels.get(documentKey)

    if (existingPanel) {
      existingPanel._document = document
      existingPanel._panel.reveal(column)
      existingPanel._update()
      return
    }

    const panel = vscode.window.createWebviewPanel(
      XmlPreviewPanel.viewType,
      `${path.basename(document.fileName)} Preview`,
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      },
    )

    const previewPanel = new XmlPreviewPanel(panel, document)
    XmlPreviewPanel.panels.set(documentKey, previewPanel)
  }

  /**
   * 更新指定文档的 XML 预览
   */
  public static update(document: vscode.TextDocument) {
    const existingPanel = XmlPreviewPanel.panels.get(
      getDocumentKey(document.uri),
    )
    if (existingPanel) {
      existingPanel._document = document
      existingPanel._update()
    }
  }

  /**
   * 从文件系统刷新当前激活的 XML 预览
   */
  public static async refreshActive(): Promise<boolean> {
    const activePanel = Array.from(XmlPreviewPanel.panels.values()).find(
      panel => panel._panel.active,
    )
    if (!activePanel) {
      return false
    }
    await activePanel._refreshFromDisk(true)
    return true
  }

  private constructor(
    panel: vscode.WebviewPanel,
    document: vscode.TextDocument,
  ) {
    this._panel = panel
    this._document = document
    this._documentKey = getDocumentKey(document.uri)

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)
    this._panel.onDidChangeViewState(
      event => {
        if (event.webviewPanel.active) {
          void this._refreshFromDisk()
        }
      },
      null,
      this._disposables,
    )
    this._disposables.push(
      watchDocument(document.uri, () => this._refreshFromDisk()),
    )
    this._update()
  }

  /**
   * 清理资源
   */
  public dispose() {
    XmlPreviewPanel.panels.delete(this._documentKey)
    this._panel.dispose()
    while (this._disposables.length) {
      const disposable = this._disposables.pop()
      if (disposable) {
        disposable.dispose()
      }
    }
  }

  /**
   * 更新 XML 预览内容
   */
  private _update(xmlContent = this._document.getText()) {
    const fileName = path.basename(this._document.fileName)

    this._panel.title = `${fileName} Preview`
    this._panel.webview.html = this._getHtmlContent(xmlContent, fileName)
  }

  /**
   * 从文件系统读取最新内容并更新预览
   */
  private async _refreshFromDisk(showError = false) {
    try {
      const content =
        !this._document.isClosed && this._document.isDirty
          ? this._document.getText()
          : await readDocumentText(this._document.uri)
      this._update(content)
    } catch (error) {
      console.error('Failed to refresh XML preview', error)
      if (showError) {
        vscode.window.showErrorMessage(
          `Failed to refresh preview: ${getErrorMessage(error)}`,
        )
      }
    }
  }

  /**
   * 生成 XML 源码预览页面
   */
  private _getHtmlContent(xmlContent: string, fileName: string): string {
    const title = escapeHtml(`${fileName} XML Preview`)
    const source = serializeForScript(xmlContent)
    const nonce = getNonce()

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'">
  <title>${title}</title>
  <style>
    :root {
      color-scheme: light dark;
    }
    body {
      margin: 0;
      color: var(--vscode-editor-foreground);
      background: var(--vscode-editor-background);
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-editor-font-size);
    }
    .notice {
      padding: 14px 16px 12px;
      border-bottom: 2px solid var(--vscode-editor-foreground);
      font-family: var(--vscode-font-family);
      font-size: 18px;
      line-height: 1.4;
    }
    .tree, .error {
      padding: 14px 16px;
    }
    .node {
      margin-left: 20px;
    }
    .tree > .node {
      margin-left: 0;
    }
    details > summary {
      cursor: default;
      list-style-position: outside;
    }
    summary::marker {
      color: var(--vscode-descriptionForeground);
    }
    .line {
      min-height: 1.45em;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .tag, .punctuation {
      color: var(--vscode-debugTokenExpression-name, #a3158f);
    }
    .attribute-name {
      color: var(--vscode-debugTokenExpression-string, #a31515);
    }
    .attribute-value {
      color: var(--vscode-debugTokenExpression-number, #0451a5);
    }
    .comment {
      color: var(--vscode-editorLineNumber-foreground);
    }
    .error {
      margin: 0;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      color: var(--vscode-errorForeground);
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}">
    const xmlSource = ${source}
    const app = document.getElementById('app')
    const parser = new DOMParser()
    const xml = parser.parseFromString(xmlSource, 'application/xml')
    const parserError = xml.querySelector('parsererror')

    if (parserError) {
      const error = document.createElement('pre')
      error.className = 'error'
      error.textContent = parserError.textContent || 'Failed to parse XML.'
      app.append(error)
    } else {
      const notice = document.createElement('div')
      notice.className = 'notice'
      notice.textContent =
        'This XML file does not appear to have any style information associated with it. The document tree is shown below.'
      app.append(notice)

      const tree = document.createElement('div')
      tree.className = 'tree'
      for (const child of xml.childNodes) {
        if (
          child.nodeType === Node.PROCESSING_INSTRUCTION_NODE &&
          child.nodeName.toLowerCase() === 'xml'
        ) {
          continue
        }
        const rendered = renderNode(child)
        if (rendered) {
          tree.append(rendered)
        }
      }
      app.append(tree)
    }

    function renderNode(node) {
      switch (node.nodeType) {
        case Node.ELEMENT_NODE:
          return renderElement(node)
        case Node.COMMENT_NODE:
          return renderTextLine('<!--' + node.data + '-->', 'comment')
        case Node.CDATA_SECTION_NODE:
          return renderTextLine('<![CDATA[' + node.data + ']]>', 'comment')
        case Node.PROCESSING_INSTRUCTION_NODE:
          return renderTextLine(
            '<?' + node.nodeName + ' ' + node.nodeValue + '?>',
            'comment',
          )
        case Node.DOCUMENT_TYPE_NODE:
          return renderTextLine(renderDoctype(node), 'comment')
        case Node.TEXT_NODE:
          return node.data.trim()
            ? renderTextLine(node.data.trim(), 'text')
            : null
        default:
          return null
      }
    }

    function renderElement(element) {
      const visibleChildren = Array.from(element.childNodes).filter(
        child =>
          child.nodeType !== Node.TEXT_NODE ||
          child.data.trim().length > 0,
      )
      const hasStructuredChildren = visibleChildren.some(
        child => child.nodeType !== Node.TEXT_NODE,
      )
      const container = document.createElement('div')
      container.className = 'node'

      if (!hasStructuredChildren) {
        const line = document.createElement('div')
        line.className = 'line'
        appendOpeningTag(line, element, visibleChildren.length === 0)
        if (visibleChildren.length > 0) {
          line.append(
            document.createTextNode(
              visibleChildren.map(child => child.data).join(''),
            ),
          )
          appendClosingTag(line, element)
        }
        container.append(line)
        return container
      }

      const details = document.createElement('details')
      details.open = true
      const summary = document.createElement('summary')
      summary.className = 'line'
      appendOpeningTag(summary, element, false)
      details.append(summary)

      const children = document.createElement('div')
      for (const child of visibleChildren) {
        const rendered = renderNode(child)
        if (rendered) {
          children.append(rendered)
        }
      }
      details.append(children)

      const closing = document.createElement('div')
      closing.className = 'line'
      appendClosingTag(closing, element)
      details.append(closing)
      container.append(details)
      return container
    }

    function appendOpeningTag(target, element, selfClosing) {
      appendToken(target, '<', 'punctuation')
      appendToken(target, element.nodeName, 'tag')
      for (const attribute of element.attributes) {
        target.append(document.createTextNode(' '))
        appendToken(target, attribute.name, 'attribute-name')
        appendToken(target, '="', 'punctuation')
        appendToken(target, attribute.value, 'attribute-value')
        appendToken(target, '"', 'punctuation')
      }
      appendToken(target, selfClosing ? '/>' : '>', 'punctuation')
    }

    function appendClosingTag(target, element) {
      appendToken(target, '</', 'punctuation')
      appendToken(target, element.nodeName, 'tag')
      appendToken(target, '>', 'punctuation')
    }

    function appendToken(target, value, className) {
      const token = document.createElement('span')
      token.className = className
      token.textContent = value
      target.append(token)
    }

    function renderTextLine(value, className) {
      const line = document.createElement('div')
      line.className = 'node line ' + className
      line.textContent = value
      return line
    }

    function renderDoctype(node) {
      let value = '<!DOCTYPE ' + node.name
      if (node.publicId) {
        value += ' PUBLIC "' + node.publicId + '"'
      }
      if (node.systemId) {
        value += (node.publicId ? ' "' : ' SYSTEM "') + node.systemId + '"'
      }
      return value + '>'
    }
  </script>
</body>
</html>`
  }
}

/**
 * 生成 Webview 内联脚本使用的随机 nonce
 */
function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let value = ''
  for (let index = 0; index < 32; index++) {
    value += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return value
}
