const assert = require('node:assert/strict')
const test = require('node:test')
const MarkdownIt = require('markdown-it')
const { default: mermaidPlugin } = require('../src/plugins/mermaid.ts')
const { default: graphvizPlugin } = require('../src/plugins/graphviz-block.ts')
const {
  decodeGraphvizSource,
  isGraphvizCodeBlock,
} = require('../src/core/graphviz.ts')
const { renderGraphviz } = require('../src/plugins/graphviz-renderer.ts')

test('routes DOT fences after the actual Mermaid plugin without changing other fences', () => {
  const md = new MarkdownIt().use(mermaidPlugin)
  const flowchart = '```mermaid\ngraph TD\n A-->B\n```'
  const javascript = '```js\nconst x = 1\n```'
  const expected = [md.render(flowchart), md.render(javascript)]
  md.use(graphvizPlugin)
  for (const info of ['digraph', 'dot', 'graphviz', 'mermaid', 'DOT']) {
    const code = 'digraph G { a -> b [label="中文 😀 <script>"]; }'
    const html = md.render('```' + info + '\n' + code + '\n```')
    assert.equal(
      decodeGraphvizSource(html.match(/data-graphviz-source="([^"]+)"/)[1]),
      code,
    )
    assert.ok(html.includes('&lt;script&gt;'))
    assert.ok(!html.includes('<script>'))
    assert.ok(html.includes('data-graphviz-status="pending"'))
  }
  assert.deepEqual([md.render(flowchart), md.render(javascript)], expected)
})

test('distinguishes DOT graphs from Mermaid graphs and unmarked code', () => {
  assert.equal(
    isGraphvizCodeBlock('mermaid', 'strict graph G { a -- b }'),
    true,
  )
  assert.equal(isGraphvizCodeBlock('mermaid', 'graph LR\n A-->B'), false)
  assert.equal(isGraphvizCodeBlock('text', 'digraph G { a -> b }'), false)
})

test('skips completed diagrams without initializing WASM', async () => {
  await renderGraphviz({
    querySelectorAll: () => [
      {
        getAttribute: () => 'ready',
      },
    ],
  })
})
