const assert = require('node:assert/strict')
const test = require('node:test')
const MarkdownIt = require('markdown-it')
const {
  default: mermaidPlugin,
  renderMermaid,
} = require('../src/plugins/mermaid.ts')

test('preserves Mermaid source as escaped text for asynchronous rendering', () => {
  const md = new MarkdownIt().use(mermaidPlugin)
  const html = md.render('```mermaid\ngraph TD\n A["<script>"] --> B\n```')

  assert.equal(
    html,
    '<pre class="mermaid">graph TD\n A[&quot;&lt;script&gt;&quot;] --&gt; B</pre>',
  )
})

test('keeps the original renderer for other fenced code blocks', () => {
  const md = new MarkdownIt()
  const expected = md.render('```js\nconst x = 1\n```')

  md.use(mermaidPlugin)
  assert.equal(md.render('```js\nconst x = 1\n```'), expected)
})

test('does not initialize DOM rendering when no Mermaid diagrams exist', async () => {
  await renderMermaid({ querySelectorAll: () => [] })
})
