const assert = require('node:assert/strict')
const test = require('node:test')
const MarkdownIt = require('markdown-it')
const plugin = require('../src/plugins/toc.ts').default

test('TOC links use unique heading IDs including formatted and duplicate headings', () => {
  const md = new MarkdownIt({ html: true }).use(plugin)
  const html = md.render(
    '# Title\n\n<!-- omit from toc -->\n## Contents\n\n[[toc]]\n\n## **中文** `code`\n\n### Detail\n\n## **中文** `code`\n\n## 中文 code-1\n\n#### Hidden',
  )
  const toc = html.match(/<div class="table-of-contents">([\s\S]*?)<\/div>/)[1]
  const links = [...toc.matchAll(/href="#([^"]+)"/g)].map(match => match[1])
  const ids = [...html.matchAll(/<h[1-6] id="([^"]+)"/g)].map(match => match[1])
  assert.equal(links.length, 4)
  assert.equal(new Set(ids).size, ids.length)
  for (const link of links) assert.ok(ids.includes(link))
  assert.ok(!toc.includes('Title'))
  assert.ok(!toc.includes('Contents'))
  assert.ok(!toc.includes('Hidden'))
  assert.ok(links.includes(encodeURIComponent('中文 code').replace('%20', '-')))
})
