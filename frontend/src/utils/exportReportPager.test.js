import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  DEFAULT_PAGE_SIZE,
  DISTRICTS,
  PAGE_SIZES,
  filterIndices,
  pageNumbers,
  paginate,
  parseExportHash,
  rowMatches,
  serializeExportHash,
  statusText,
  visibleMatchSlice,
} from './exportReportPager.js'

function sampleRows() {
  const rows = []
  const districts = DISTRICTS
  const classes = ['High', 'Medium', 'Low']
  for (let rank = 1; rank <= 897; rank += 1) {
    rows.push({
      rank,
      name: `Barangay ${rank}`,
      class: classes[Math.floor((rank - 1) / 299)],
      district: districts[(rank - 1) % 6],
    })
  }
  return rows
}

test('897 rows at 50 per page give 18 pages and the first page is 1 to 50', () => {
  const info = paginate(897, 1, 50)
  assert.equal(DEFAULT_PAGE_SIZE, 50)
  assert.deepEqual(PAGE_SIZES, [25, 50, 100])
  assert.equal(info.totalPages, 18)
  assert.equal(info.start, 1)
  assert.equal(info.end, 50)
  assert.equal(statusText(info), 'Showing 1 to 50 of 897 barangays')
  const last = paginate(897, 18, 50)
  assert.equal(last.start, 851)
  assert.equal(last.end, 897)
})

test('High filter yields 299 rows and 6 pages; ranks stay overall ranks', () => {
  const rows = sampleRows()
  const matched = filterIndices(rows, { class: 'High', district: '', q: '' })
  assert.equal(matched.length, 299)
  const info = paginate(matched.length, 1, 50)
  assert.equal(info.totalPages, 6)
  const slice = visibleMatchSlice(matched, info)
  assert.equal(rows[slice[0]].rank, 1)
  assert.equal(rows[slice[slice.length - 1]].rank, 50)
  const page6 = paginate(matched.length, 6, 50)
  const lastSlice = visibleMatchSlice(matched, page6)
  assert.equal(rows[lastSlice[lastSlice.length - 1]].rank, 299)
  assert.equal(rows[lastSlice[lastSlice.length - 1]].class, 'High')
})

test('search 310 returns the matching barangay and ignores case', () => {
  const rows = sampleRows()
  const matched = filterIndices(rows, { class: '', district: '', q: '310' })
  assert.equal(matched.length, 1)
  assert.equal(rows[matched[0]].name, 'Barangay 310')
  assert.equal(rows[matched[0]].rank, 310)
  assert.equal(rowMatches(rows[309], { q: 'BARANGAY 310' }), true)
})

test('invalid hash values fall back to defaults', () => {
  assert.deepEqual(parseExportHash('#page=nope&size=7&class=Critical&district=X&q=<b>x</b>'), {
    page: 1,
    size: 50,
    class: '',
    district: '',
    q: '<b>x</b>',
  })
  assert.deepEqual(parseExportHash('#page=3&size=50&class=High&district=VI&q=310'), {
    page: 3,
    size: 50,
    class: 'High',
    district: 'VI',
    q: '310',
  })
  assert.equal(serializeExportHash({ page: 1, size: 50, class: '', district: '', q: '' }), '')
  assert.equal(serializeExportHash({ page: 3, size: 50, class: 'High', district: 'VI', q: '310' }), '#page=3&class=High&district=VI&q=310')
})

test('page number list includes first, last, current plus or minus 2, and ellipsis', () => {
  assert.deepEqual(pageNumbers(1, 18), [1, 2, 3, '...', 18])
  assert.deepEqual(pageNumbers(8, 18), [1, '...', 6, 7, 8, 9, 10, '...', 18])
  assert.deepEqual(pageNumbers(18, 18), [1, '...', 16, 17, 18])
})

test('district plus search keeps overall rank numbers', () => {
  const rows = sampleRows()
  const only = filterIndices(rows, { class: '', district: 'VI', q: '' })
  assert.ok(only.length > 0)
  only.forEach((index) => {
    assert.equal(rows[index].district, 'VI')
    assert.equal(rows[index].rank, index + 1)
  })
  const info = paginate(only.length, 2, 25)
  const slice = visibleMatchSlice(only, info)
  assert.equal(slice.length, 25)
  assert.equal(rows[slice[0]].rank, rows[only[info.start - 1]].rank)
  const named = filterIndices(rows, { class: '', district: 'VI', q: '310' })
  assert.equal(named.length, 0)
})
