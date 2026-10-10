const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const ts = require('typescript')

function loadHtmlUtils() {
  const fileName = path.resolve(__dirname, '../src/utils/html.ts')
  const source = fs.readFileSync(fileName, 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName,
  }).outputText
  const module = { exports: {} }
  const execute = new Function('module', 'exports', output)
  execute(module, module.exports)
  return module.exports
}

const { escapeHtml, serializeForScript, wrapHtmlContent } = loadHtmlUtils()
const baseUri = 'https://example.test/docs'
const baseTag = `<base href="${baseUri}/">`

test('inserts base immediately after a compact head tag', () => {
  const html = '<html><head><title>Demo</title></head><body></body></html>'
  const result = wrapHtmlContent(html, baseUri)

  assert.equal(
    result,
    `<html><head>\n  ${baseTag}<title>Demo</title></head><body></body></html>`,
  )
})

test('preserves attributes on the head tag', () => {
  const html = '<head data-page="preview"><title>Demo</title></head>'
  const result = wrapHtmlContent(html, baseUri)

  assert.match(result, new RegExp(`^<head data-page="preview">\\n  `))
  assert.ok(result.includes(baseTag))
})

test('creates a head when only an html tag exists', () => {
  const result = wrapHtmlContent('<html><body>Demo</body></html>', baseUri)

  assert.equal(
    result,
    `<html>\n<head>\n  ${baseTag}\n</head><body>Demo</body></html>`,
  )
})

test('wraps an HTML fragment', () => {
  const result = wrapHtmlContent('<main>Demo</main>', baseUri)

  assert.ok(result.startsWith('<!DOCTYPE html>\n<html>\n<head>'))
  assert.ok(result.includes(baseTag))
  assert.ok(result.endsWith('<body>\n<main>Demo</main>\n</body>\n</html>'))
})

test('keeps an existing base href unchanged', () => {
  const html =
    '<html><head><base href="https://cdn.example/"></head><body></body></html>'

  assert.equal(wrapHtmlContent(html, baseUri), html)
})

test('escapes XML content before displaying it in HTML', () => {
  assert.equal(
    escapeHtml('<item label="A&B">\'value\'</item>'),
    '&lt;item label=&quot;A&amp;B&quot;&gt;&#39;value&#39;&lt;/item&gt;',
  )
})

test('serializes XML safely for an inline script', () => {
  const result = serializeForScript(
    '</script><catalog>line\u2028separator</catalog>',
  )

  assert.equal(
    result,
    '"\\u003c/script>\\u003ccatalog>line\\u2028separator\\u003c/catalog>"',
  )
  assert.ok(!result.includes('</script>'))
})
