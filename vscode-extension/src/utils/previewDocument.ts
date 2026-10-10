import * as path from 'path'
import * as vscode from 'vscode'

const FILE_CHANGE_DEBOUNCE_MS = 150

/**
 * 获取可保留 URI scheme 和 authority 的文档标识
 */
export function getDocumentKey(uri: vscode.Uri): string {
  return uri.toString()
}

/**
 * 获取文档所在目录并保留远程 URI 信息
 */
export function getDocumentDirectory(uri: vscode.Uri): vscode.Uri {
  return vscode.Uri.joinPath(uri.with({ query: '', fragment: '' }), '..')
}

/**
 * 从文件系统读取 UTF-8 文本，绕过可能过期的 TextDocument 缓存
 */
export async function readDocumentText(uri: vscode.Uri): Promise<string> {
  const data = await vscode.workspace.fs.readFile(uri)
  return new TextDecoder().decode(data)
}

/**
 * 监听单个文档的外部变更，并合并短时间内的重复事件
 */
export function watchDocument(
  uri: vscode.Uri,
  onDidChange: () => void | Promise<void>,
): vscode.Disposable {
  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(
      getDocumentDirectory(uri),
      path.posix.basename(uri.path),
    ),
    false,
    false,
    true,
  )
  let timer: ReturnType<typeof setTimeout> | undefined

  const scheduleRefresh = () => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      timer = undefined
      void onDidChange()
    }, FILE_CHANGE_DEBOUNCE_MS)
  }

  return vscode.Disposable.from(
    watcher,
    watcher.onDidChange(scheduleRefresh),
    watcher.onDidCreate(scheduleRefresh),
    new vscode.Disposable(() => {
      if (timer) {
        clearTimeout(timer)
      }
    }),
  )
}

/**
 * 将未知错误转换为可展示的文本
 */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}
