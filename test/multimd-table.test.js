const assert = require('node:assert/strict')
const test = require('node:test')
const MarkdownIt = require('markdown-it')
const plugin = require('../src/plugins/multimd-table.ts').default

test('renders extended tables with MarkdownIt 15 and restores parser utilities', () => {
  const md = new MarkdownIt()
  const previous = md.utils.assign
  md.use(plugin)

  const html = md.render('| A | B |\n|---|---|\n| colspan ||')
  assert.match(html, /<td colspan="2">colspan<\/td>/)
  assert.equal(md.utils.assign, previous)
})
