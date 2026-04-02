import * as vscode from 'vscode'
import * as path from 'path'

/**
 * HTML 预览面板管理类
 * 负责创建和管理 HTML 文件的 Webview 预览面板
 */
export class HtmlPreviewPanel {
  private static readonly panels: Map<string, HtmlPreviewPanel> = new Map()
  public static readonly viewType = 'myMdReader.htmlPreview'

  private readonly _panel: vscode.WebviewPanel
  private readonly _documentUri: string
  private _document: vscode.TextDocument
  private _disposables: vscode.Disposable[] = []

  /**
   * 创建或显示 HTML 预览面板
   */
  public static createOrShow(
    extensionUri: vscode.Uri,
    document: vscode.TextDocument,
  ) {
    const column = vscode.ViewColumn.Active
    const documentKey = document.uri.fsPath
    const existingPanel = HtmlPreviewPanel.panels.get(documentKey)

    if (existingPanel) {
      existingPanel._document = document
      existingPanel._panel.reveal(column)
      existingPanel._update()
      return
    }

    const documentDir = vscode.Uri.file(path.dirname(document.uri.fsPath))
    const workspaceFolders = vscode.workspace.workspaceFolders || []
    const localResourceRoots = [
      vscode.Uri.joinPath(extensionUri, 'dist'),
      documentDir,
      ...workspaceFolders.map(folder => folder.uri),
    ]

    const panel = vscode.window.createWebviewPanel(
      HtmlPreviewPanel.viewType,
      `${path.basename(document.fileName)} Preview`,
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots,
      },
    )

    const previewPanel = new HtmlPreviewPanel(panel, document)
    HtmlPreviewPanel.panels.set(documentKey, previewPanel)
  }

  /**
   * 更新指定文档的预览内容
   */
  public static update(document: vscode.TextDocument) {
    const documentKey = document.uri.fsPath
    const existingPanel = HtmlPreviewPanel.panels.get(documentKey)
    if (existingPanel) {
      existingPanel._document = document
      existingPanel._update()
    }
  }

  private constructor(
    panel: vscode.WebviewPanel,
    document: vscode.TextDocument,
  ) {
    this._panel = panel
    this._document = document
    this._documentUri = document.uri.fsPath

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)
    this._update()
  }

  /**
   * 清理资源
   */
  public dispose() {
    HtmlPreviewPanel.panels.delete(this._documentUri)
    this._panel.dispose()
    while (this._disposables.length) {
      const disposable = this._disposables.pop()
      if (disposable) {
        disposable.dispose()
      }
    }
  }

  /**
   * 更新预览内容，将 HTML 文件内容直接作为 webview HTML 呈现
   */
  private _update() {
    const fileName = path.basename(this._document.fileName)
    this._panel.title = `${fileName} Preview`

    const htmlContent = this._document.getText()
    const dirPath = path.dirname(this._document.uri.fsPath)
    const baseUri = this._panel.webview
      .asWebviewUri(vscode.Uri.file(dirPath))
      .toString()

    this._panel.webview.html = this._wrapHtmlContent(htmlContent, baseUri)
  }

  /**
   * 处理 HTML 内容，注入 base 标签使相对路径资源能正确加载
   */
  private _wrapHtmlContent(htmlContent: string, baseUri: string): string {
    const baseTag = `<base href="${baseUri}/">`

    if (/<head[\s>]/i.test(htmlContent)) {
      return htmlContent.replace(/(<head[\s>][^>]*>)/i, `$1\n  ${baseTag}`)
    }

    if (/<html[\s>]/i.test(htmlContent)) {
      return htmlContent.replace(
        /(<html[\s>][^>]*>)/i,
        `$1\n<head>\n  ${baseTag}\n</head>`,
      )
    }

    return `<!DOCTYPE html>\n<html>\n<head>\n  ${baseTag}\n</head>\n<body>\n${htmlContent}\n</body>\n</html>`
  }
}
