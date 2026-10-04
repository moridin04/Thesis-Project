(function () {
  var root = document.documentElement
  root.classList.add('js')
  var table = document.querySelector('table.t')
  if (!table) return
  var tbody = table.tBodies[0]
  var emptyRow = document.getElementById('empty-row')
  var rows = []
  var index
  for (index = 0; index < tbody.rows.length; index += 1) {
    if (tbody.rows[index].id !== 'empty-row') rows.push(tbody.rows[index])
  }
  var records = rows.map(function (tr) {
    return {
      el: tr,
      name: tr.getAttribute('data-name') || '',
      class: tr.getAttribute('data-class') || '',
      district: tr.getAttribute('data-district') || '',
    }
  })
  var sizeSel = document.getElementById('page-size')
  var search = document.getElementById('q')
  var classSel = document.getElementById('class-filter')
  var distSel = document.getElementById('district-filter')
  var resetBtn = document.getElementById('reset')
  var pagers = document.querySelectorAll('.pager-nav')
  var statuses = document.querySelectorAll('.pager-status')
  if (!sizeSel || !search || !classSel || !distSel || !resetBtn) return

  var debounceTimer = null
  var applyingHash = false
  var printed = null

  function controlsState(page) {
    return {
      page: page || 1,
      size: Number(sizeSel.value),
      class: classSel.value,
      district: distSel.value,
      q: search.value,
    }
  }

  function syncControls(state) {
    sizeSel.value = String(state.size)
    classSel.value = state.class
    distSel.value = state.district
    search.value = state.q
  }

  function renderPager(nav, info) {
    nav.textContent = ''
    function addButton(label, page, options) {
      var button = document.createElement('button')
      button.type = 'button'
      button.textContent = label
      if (options.disabled) button.disabled = true
      if (options.current) button.setAttribute('aria-current', 'page')
      if (!options.disabled && page) {
        button.addEventListener('click', function () {
          apply(controlsState(page), { scroll: true })
        })
      }
      nav.appendChild(button)
    }
    addButton('First', 1, { disabled: info.page === 1 })
    addButton('Previous', info.page - 1, { disabled: info.page === 1 })
    pageNumbers(info.page, info.totalPages).forEach(function (item) {
      if (item === '...') {
        var gap = document.createElement('span')
        gap.className = 'gap'
        gap.textContent = '\u2026'
        nav.appendChild(gap)
      } else {
        addButton(String(item), item, { current: item === info.page })
      }
    })
    addButton('Next', info.page + 1, { disabled: info.page === info.totalPages })
    addButton('Last', info.totalPages, { disabled: info.page === info.totalPages })
  }

  function writeHash(state) {
    var next = serializeExportHash(state)
    var current = location.hash || ''
    if (current === next) return
    if (!next && !current) return
    history.replaceState(null, '', next ? next : location.pathname + location.search)
  }

  function apply(state, options) {
    options = options || {}
    var matched = filterIndices(records, state)
    var info = paginate(matched.length, state.page, state.size)
    state.page = info.page
    var visible = visibleMatchSlice(matched, info)
    var show = {}
    visible.forEach(function (rowIndex) {
      show[rowIndex] = true
    })
    records.forEach(function (row, rowIndex) {
      if (show[rowIndex]) row.el.removeAttribute('hidden')
      else row.el.setAttribute('hidden', '')
    })
    if (emptyRow) {
      if (info.total === 0) emptyRow.removeAttribute('hidden')
      else emptyRow.setAttribute('hidden', '')
    }
    var text = statusText(info)
    statuses.forEach(function (node) {
      node.textContent = text
    })
    pagers.forEach(function (nav) {
      renderPager(nav, info)
    })
    if (!applyingHash) writeHash(state)
    if (options.scroll) {
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      table.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    }
  }

  function fromHash() {
    applyingHash = true
    var state = parseExportHash(location.hash)
    syncControls(state)
    apply(state, { scroll: false })
    applyingHash = false
  }

  sizeSel.addEventListener('change', function () {
    apply(controlsState(1), { scroll: true })
  })
  classSel.addEventListener('change', function () {
    apply(controlsState(1), { scroll: true })
  })
  distSel.addEventListener('change', function () {
    apply(controlsState(1), { scroll: true })
  })
  search.addEventListener('input', function () {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(function () {
      apply(controlsState(1), { scroll: true })
    }, 150)
  })
  resetBtn.addEventListener('click', function () {
    search.value = ''
    classSel.value = ''
    distSel.value = ''
    sizeSel.value = String(DEFAULT_PAGE_SIZE)
    apply(controlsState(1), { scroll: true })
  })
  window.addEventListener('hashchange', fromHash)
  window.addEventListener('beforeprint', function () {
    printed = parseExportHash(location.hash)
    records.forEach(function (row) {
      row.el.removeAttribute('hidden')
    })
    if (emptyRow) emptyRow.setAttribute('hidden', '')
  })
  window.addEventListener('afterprint', function () {
    if (printed) apply(printed, { scroll: false })
  })
  fromHash()
})()
