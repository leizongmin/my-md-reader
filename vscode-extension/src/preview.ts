import * as vscode from 'vscode'
import * as path from 'path'
import { getConfiguration, PreviewConfig } from './utils/config'

/**
 * Markdown 预览面板管理类
 * 负责创建、更新和管理 Webview 预览面板
 */
export class MarkdownPreviewPanel {
  public static currentPanel: MarkdownPreviewPanel | undefined
  public static readonly viewType = 'myMdReader.preview'

  private readonly _panel: vscode.WebviewPanel
  private readonly _extensionUri: vscode.Uri
  private _document: vscode.TextDocument
  private _disposables: vscode.Disposable[] = []

  /**
   * 创建或显示预览面板
   */
  public static createOrShow(
    extensionUri: vscode.Uri,
    document: vscode.TextDocument,
  ) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined

    if (MarkdownPreviewPanel.currentPanel) {
      MarkdownPreviewPanel.currentPanel._document = document
      MarkdownPreviewPanel.currentPanel._panel.reveal(column)
      MarkdownPreviewPanel.currentPanel._update()
      return
    }

    const documentDir = vscode.Uri.file(path.dirname(document.uri.fsPath))
    const workspaceFolders = vscode.workspace.workspaceFolders || []
    const localResourceRoots = [
      vscode.Uri.joinPath(extensionUri, 'dist'),
      vscode.Uri.joinPath(extensionUri, 'media'),
      documentDir,
      ...workspaceFolders.map(folder => folder.uri),
    ]

    const panel = vscode.window.createWebviewPanel(
      MarkdownPreviewPanel.viewType,
      `${path.basename(document.fileName)} Preview`,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots,
      },
    )

    MarkdownPreviewPanel.currentPanel = new MarkdownPreviewPanel(
      panel,
      extensionUri,
      document,
    )
  }

  /**
   * 更新指定文档的预览内容
   */
  public static update(document: vscode.TextDocument) {
    if (
      MarkdownPreviewPanel.currentPanel &&
      MarkdownPreviewPanel.currentPanel._document.uri.fsPath ===
        document.uri.fsPath
    ) {
      MarkdownPreviewPanel.currentPanel._document = document
      MarkdownPreviewPanel.currentPanel._update()
    }
  }

  /**
   * 更新配置
   */
  public static updateConfiguration() {
    if (MarkdownPreviewPanel.currentPanel) {
      MarkdownPreviewPanel.currentPanel._updateConfig()
    }
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    document: vscode.TextDocument,
  ) {
    this._panel = panel
    this._extensionUri = extensionUri
    this._document = document

    this._panel.webview.html = this._getHtmlContent()

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'copy':
            vscode.env.clipboard.writeText(message.text)
            return
          case 'openLink':
            if (message.href) {
              vscode.env.openExternal(vscode.Uri.parse(message.href))
            }
            return
        }
      },
      null,
      this._disposables,
    )

    this._update()
  }

  /**
   * 清理资源
   */
  public dispose() {
    MarkdownPreviewPanel.currentPanel = undefined
    this._panel.dispose()
    while (this._disposables.length) {
      const disposable = this._disposables.pop()
      if (disposable) {
        disposable.dispose()
      }
    }
  }

  /**
   * 更新预览内容
   */
  private _update() {
    const content = this._document.getText()
    const fileName = path.basename(this._document.fileName)
    const filePath = this._document.uri.fsPath
    const dirPath = path.dirname(filePath)
    const baseUri = this._panel.webview
      .asWebviewUri(vscode.Uri.file(dirPath))
      .toString()

    this._panel.title = `${fileName} Preview`

    this._panel.webview.postMessage({
      command: 'update',
      content,
      fileName,
      filePath,
      dirPath,
      baseUri,
    })
  }

  /**
   * 更新配置
   */
  private _updateConfig() {
    const config = getConfiguration()
    this._panel.webview.postMessage({
      command: 'updateConfig',
      config,
    })
  }

  /**
   * 生成 Webview HTML 内容
   */
  private _getHtmlContent(): string {
    const webview = this._panel.webview

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js'),
    )
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.css'),
    )

    const nonce = getNonce()
    const config = getConfiguration()

    const csp = [
      `default-src 'none'`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `script-src 'nonce-${nonce}'`,
      `img-src ${webview.cspSource} https: data:`,
      `font-src ${webview.cspSource} https: data:`,
    ].join('; ')

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <link rel="stylesheet" href="${styleUri}">
  <title>Markdown Preview</title>
</head>
<body class="md-reader" data-theme="${config.pageTheme}">
  <script nonce="${nonce}">
    window.initialConfig = ${JSON.stringify(config)};
  </script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`
  }
}

/**
 * 生成随机 nonce 用于 CSP
 */
function getNonce(): string {
  let text = ''
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}
