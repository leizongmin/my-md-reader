const assert = require('node:assert/strict')
const path = require('node:path')
const test = require('node:test')

const manifest = require(path.resolve(__dirname, '../package.json'))
const commands = new Set(
  manifest.contributes.commands.map(item => item.command),
)

test('declares preview commands', () => {
  assert.ok(commands.has('myMdReader.xmlPreview'))
  assert.ok(commands.has('myMdReader.refreshPreview'))
  assert.ok(commands.has('myMdReader.openPreviewDevTools'))
})

test('shows refresh in the title and Webview context menus', () => {
  const titleCommands = manifest.contributes.menus['editor/title'].map(
    item => item.command,
  )
  const titleContextCommands = manifest.contributes.menus[
    'editor/title/context'
  ].map(item => item.command)
  const webviewContextCommands = manifest.contributes.menus[
    'webview/context'
  ].map(item => item.command)

  assert.ok(titleCommands.includes('myMdReader.refreshPreview'))
  assert.ok(titleContextCommands.includes('myMdReader.refreshPreview'))
  assert.ok(webviewContextCommands.includes('myMdReader.refreshPreview'))
  assert.ok(webviewContextCommands.includes('myMdReader.openPreviewDevTools'))
})

test('adds XML preview actions to source file menus', () => {
  for (const menu of [
    'explorer/context',
    'editor/context',
    'editor/title',
    'editor/title/context',
  ]) {
    const menuCommands = manifest.contributes.menus[menu].map(
      item => item.command,
    )
    assert.ok(menuCommands.includes('myMdReader.xmlPreview'))
  }
})
