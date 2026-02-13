import * as vscode from 'vscode'
import { MarkdownPreviewPanel } from './preview'

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

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(document => {
      if (isMarkdownFile(document.uri)) {
        MarkdownPreviewPanel.update(document)
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
 * 插件停用时清理资源
 */
export function deactivate() {
  console.log('Markdown Reader extension is now deactivated')
}
