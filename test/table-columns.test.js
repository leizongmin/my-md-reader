const assert = require('node:assert/strict')
const test = require('node:test')
const { fitTables } = require('../src/plugins/table-columns.ts')

function cell(width, colSpan = 1, minWidth = '') {
  return {
    colSpan,
    style: { minWidth },
    getBoundingClientRect: () => ({ width }),
  }
}

test('uses actual cell geometry for merged columns and restores styles when the table fits', () => {
  const short = cell(35)
  const merged = cell(230, 2)
  const following = cell(75, 1, '2rem')
  const table = {
    rows: [{ cells: [short, merged] }, { cells: [following] }],
    style: { whiteSpace: 'normal' },
    scrollWidth: 500,
    clientWidth: 300,
  }
  const content = { querySelectorAll: () => [table] }
  fitTables(content)
  assert.equal(short.style.minWidth, 'min(10rem, 35px)')
  assert.equal(merged.style.minWidth, 'min(20rem, 230px)')
  assert.equal(following.style.minWidth, 'min(10rem, 75px)')
  assert.equal(table.style.whiteSpace, 'normal')
  table.clientWidth = 600
  fitTables(content)
  assert.equal(short.style.minWidth, '')
  assert.equal(merged.style.minWidth, '')
  assert.equal(following.style.minWidth, '2rem')
})

test('leaves a fitting table untouched without measuring cells', () => {
  const existing = cell(40, 1, '3rem')
  existing.getBoundingClientRect = () => {
    throw new Error('Unexpected measurement')
  }
  fitTables({
    querySelectorAll: () => [
      {
        rows: [{ cells: [existing] }],
        scrollWidth: 100,
        clientWidth: 100,
      },
    ],
  })
  assert.equal(existing.style.minWidth, '3rem')
})
