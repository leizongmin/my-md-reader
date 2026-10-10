import * as vscode from 'vscode'
import * as path from 'path'
import { wrapHtmlContent } from './utils/html'
import {
  getDocumentDirectory,
  getDocumentKey,
  getErrorMessage,
  readDocumentText,
  watchDocument,
} from './utils/previewDocument'

/**
 * HTML 预览面板管理类
 * 负责创建和管理 HTML 文件的 Webview 预览面板
 */
export class HtmlPreviewPanel {
  private static readonly panels: Map<string, HtmlPreviewPanel> = new Map()
  public static readonly viewType = 'myMdReader.htmlPreview'

  private readonly _panel: vscode.WebviewPanel
  private readonly _documentKey: string
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
    const documentKey = getDocumentKey(document.uri)
    const existingPanel = HtmlPreviewPanel.panels.get(documentKey)

    if (existingPanel) {
      existingPanel._document = document
      existingPanel._panel.reveal(column)
      existingPanel._update()
      return
    }

    const documentDir = getDocumentDirectory(document.uri)
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
    const documentKey = getDocumentKey(document.uri)
    const existingPanel = HtmlPreviewPanel.panels.get(documentKey)
    if (existingPanel) {
      existingPanel._document = document
      existingPanel._update()
    }
  }

  /**
   * 从文件系统刷新当前激活的 HTML 预览
   */
  public static async refreshActive(): Promise<boolean> {
    const activePanel = Array.from(HtmlPreviewPanel.panels.values()).find(
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
    HtmlPreviewPanel.panels.delete(this._documentKey)
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
  private _update(htmlContent = this._document.getText()) {
    const fileName = path.basename(this._document.fileName)
    this._panel.title = `${fileName} Preview`

    const baseUri = this._panel.webview
      .asWebviewUri(getDocumentDirectory(this._document.uri))
      .toString()

    this._panel.webview.html = wrapHtmlContent(htmlContent, baseUri)
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
      console.error('Failed to refresh HTML preview', error)
      if (showError) {
        vscode.window.showErrorMessage(
          `Failed to refresh preview: ${getErrorMessage(error)}`,
        )
      }
    }
  }
}
