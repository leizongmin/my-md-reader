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

test('retains failed diagram source and continues rendering the next diagram', async () => {
  const mermaid = (await import('mermaid')).default
  const previousRender = mermaid.render
  const previousDocument = global.document
  const source = 'flowchart TD\n A -->'
  const failed = {
    dataset: {},
    textContent: source,
    replaceChildren(...children) {
      this.children = children
    },
  }
  const valid = { dataset: {}, textContent: 'flowchart TD\n A --> B' }
  const nodes = [failed, valid]
  const calls = []
  global.document = { createElement: tag => ({ tagName: tag }) }
  mermaid.render = async (_id, text) => {
    calls.push(text)
    if (text === source) throw new Error('Invalid diagram')
    return { svg: '<svg>Valid</svg>' }
  }
  try {
    await renderMermaid({ querySelectorAll: () => nodes })
    assert.equal(failed.dataset.mermaidStatus, 'error')
    assert.equal(failed.children[1].textContent, source)
    assert.match(failed.children[0].textContent, /Invalid diagram/)
    assert.equal(valid.dataset.mermaidStatus, 'ready')
    assert.equal(valid.innerHTML, '<svg>Valid</svg>')
    await renderMermaid({ querySelectorAll: () => nodes })
    assert.equal(calls.length, 2)
  } finally {
    mermaid.render = previousRender
    global.document = previousDocument
  }
})
