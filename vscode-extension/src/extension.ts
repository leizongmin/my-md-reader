import * as vscode from 'vscode'
import { MarkdownPreviewPanel } from './preview'
import { HtmlPreviewPanel } from './htmlPreview'
import { XmlPreviewPanel } from './xmlPreview'
import { getErrorMessage } from './utils/previewDocument'

/**
 * 插件激活入口
 * 当用户打开 Markdown 文件或执行预览命令时激活
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Markdown Reader extension is now active')

  const previewCommand = vscode.commands.registerCommand(
    'myMdReader.preview',
    async (uri?: vscode.Uri) => {
      let targetUri = uri

      if (!targetUri) {
        const activeEditor = vscode.window.activeTextEditor
        if (activeEditor && isMarkdownFile(activeEditor.document.uri)) {
          targetUri = activeEditor.document.uri
        }
      }

      if (!targetUri) {
        vscode.window.showErrorMessage(
          'Please open a Markdown file or right-click on a Markdown file in the explorer',
        )
        return
      }

      if (!isMarkdownFile(targetUri)) {
        vscode.window.showErrorMessage('Please select a Markdown file')
        return
      }

      try {
        const document = await vscode.workspace.openTextDocument(targetUri)
        MarkdownPreviewPanel.createOrShow(context.extensionUri, document)
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to open file: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        )
      }
    },
  )

  context.subscriptions.push(previewCommand)

  const htmlPreviewCommand = vscode.commands.registerCommand(
    'myMdReader.htmlPreview',
    async (uri?: vscode.Uri) => {
      let targetUri = uri

      if (!targetUri) {
        const activeEditor = vscode.window.activeTextEditor
        if (activeEditor && isHtmlFile(activeEditor.document.uri)) {
          targetUri = activeEditor.document.uri
        }
      }

      if (!targetUri) {
        vscode.window.showErrorMessage(
          'Please open an HTML file or right-click on an HTML file in the explorer',
        )
        return
      }

      if (!isHtmlFile(targetUri)) {
        vscode.window.showErrorMessage('Please select an HTML file')
        return
      }

      try {
        const document = await vscode.workspace.openTextDocument(targetUri)
        HtmlPreviewPanel.createOrShow(context.extensionUri, document)
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to open file: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        )
      }
    },
  )

  context.subscriptions.push(htmlPreviewCommand)

  const xmlPreviewCommand = vscode.commands.registerCommand(
    'myMdReader.xmlPreview',
    async (uri?: vscode.Uri) => {
      let targetUri = uri

      if (!targetUri) {
        const activeEditor = vscode.window.activeTextEditor
        if (activeEditor && isXmlFile(activeEditor.document.uri)) {
          targetUri = activeEditor.document.uri
        }
      }

      if (!targetUri) {
        vscode.window.showErrorMessage(
          'Please open an XML file or right-click on an XML file in the explorer',
        )
        return
      }

      if (!isXmlFile(targetUri)) {
        vscode.window.showErrorMessage('Please select an XML file')
        return
      }

      try {
        const document = await vscode.workspace.openTextDocument(targetUri)
        XmlPreviewPanel.createOrShow(document)
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to open file: ${getErrorMessage(error)}`,
        )
      }
    },
  )

  const refreshPreviewCommand = vscode.commands.registerCommand(
    'myMdReader.refreshPreview',
    async () => {
      if (
        (await MarkdownPreviewPanel.refreshActive()) ||
        (await HtmlPreviewPanel.refreshActive()) ||
        (await XmlPreviewPanel.refreshActive())
      ) {
        return
      }
      vscode.window.showErrorMessage('No active preview to refresh')
    },
  )

  const openPreviewDevToolsCommand = vscode.commands.registerCommand(
    'myMdReader.openPreviewDevTools',
    async () => {
      try {
        await vscode.commands.executeCommand(
          'workbench.action.webview.openDeveloperTools',
        )
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to open Webview Developer Tools: ${getErrorMessage(error)}`,
        )
      }
    },
  )

  context.subscriptions.push(
    xmlPreviewCommand,
    refreshPreviewCommand,
    openPreviewDevToolsCommand,
  )

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(document => {
      updatePreview(document)
    }),
  )

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      if (!event.document.isDirty && event.contentChanges.length > 0) {
        updatePreview(event.document)
      }
    }),
  )

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('myMdReader')) {
        MarkdownPreviewPanel.updateConfiguration()
      }
    }),
  )
}

/**
 * 检查文件是否为 Markdown 文件
 */
function isMarkdownFile(uri: vscode.Uri): boolean {
  const ext = uri.fsPath.toLowerCase()
  return (
    ext.endsWith('.md') ||
    ext.endsWith('.mdx') ||
    ext.endsWith('.mkd') ||
    ext.endsWith('.markdown')
  )
}

/**
 * 检查文件是否为 HTML 文件
 */
function isHtmlFile(uri: vscode.Uri): boolean {
  const ext = uri.fsPath.toLowerCase()
  return ext.endsWith('.html') || ext.endsWith('.htm')
}

/**
 * 检查文件是否为 XML 文件
 */
function isXmlFile(uri: vscode.Uri): boolean {
  return uri.fsPath.toLowerCase().endsWith('.xml')
}

/**
 * 更新文档对应的预览面板
 */
function updatePreview(document: vscode.TextDocument) {
  if (isMarkdownFile(document.uri)) {
    MarkdownPreviewPanel.update(document)
  }
  if (isHtmlFile(document.uri)) {
    HtmlPreviewPanel.update(document)
  }
  if (isXmlFile(document.uri)) {
    XmlPreviewPanel.update(document)
  }
}

/**
 * 插件停用时清理资源
 */
export function deactivate() {
  console.log('Markdown Reader extension is now deactivated')
}
