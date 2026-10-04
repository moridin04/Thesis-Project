import assert from 'node:assert/strict'
import { test } from 'node:test'

import { importanceTicks } from './importanceScale.js'

test('keeps each chart on its own published scale', () => {
  assert.deepEqual(importanceTicks(0.6018), [0, 0.2, 0.4, 0.6, 0.8])
  assert.deepEqual(importanceTicks(0.4285), [0, 0.15, 0.3, 0.45, 0.6])
  assert.deepEqual(importanceTicks(0.3095), [0, 0.08, 0.16, 0.24, 0.32])
})

test('a maximum that lands on a tick is not pushed to the next step', () => {
  assert.deepEqual(importanceTicks(0.8), [0, 0.2, 0.4, 0.6, 0.8])
  assert.deepEqual(importanceTicks(0.6), [0, 0.15, 0.3, 0.45, 0.6])
})

test('always returns five ticks, including for empty or zero data', () => {
  assert.equal(importanceTicks(0.0042).length, 5)
  assert.deepEqual(importanceTicks(0), [0, 0.25, 0.5, 0.75, 1])
})
