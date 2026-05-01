import assert from 'node:assert/strict'
import test from 'node:test'
import * as dragonwatch from '../../dist/index.js'

test('unit: exports SwapSet', () => {
  assert.equal(typeof dragonwatch.SwapSet, 'function')
})
