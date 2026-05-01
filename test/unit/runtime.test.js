import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import test from 'node:test'
import {
  createDocument,
  FakePointerEvent,
  flushAnimations,
  installFakeDom,
} from './fake-dom.js'

installFakeDom()

const api = await import('../../dist/index.js')

function rect(left, top, size = 10) {
  return {
    left,
    top,
    right: left + size,
    bottom: top + size,
  }
}

function pointer(type, init = {}) {
  return new FakePointerEvent(type, init)
}

test('unit: watch helpers assign and remove watcher datasets', () => {
  const document = createDocument()
  const watcher = document.createElement('watcher')
  const watched = document.createElement('watched')

  api.startWatch(watcher, watched)
  assert.equal(watcher.dataset.dragonWatches, watched.dataset.dragonwatchId)

  const id = watched.dataset.dragonwatchId
  api.startWatch(watcher, watched)
  assert.equal(watched.dataset.dragonwatchId, id)

  const other = document.createElement('other')
  api.stopWatch(watcher, other)
  assert.equal(watcher.dataset.dragonWatches, id)

  api.stopWatch(watcher, watched)
  assert.equal(watcher.dataset.dragonWatches, undefined)
})

test('unit: drag ignores non-elements and reports movement lifecycle', () => {
  const document = createDocument()
  const dragged = document.createElement('dragged')
  const watcher = document.createElement('watcher')
  document.body.append(dragged, watcher)
  dragged.setRect(rect(0, 0, 20))
  watcher.setRect(rect(5, 5, 20))

  api.drag({ target: {} })

  const events = []
  api.drag(
    { target: dragged, pointerId: 4 },
    (_dragged, target) => events.push(['start', target.id]),
    (_dragged, target) => events.push(['stop', target.id]),
    (_dragged, detail, event) =>
      events.push(['move', detail.x, detail.y, event.pointerId])
  )

  document.dispatchEvent(pointer('pointermove', { pointerId: 999 }))
  document.setElementsFromPoint([watcher])
  document.dispatchEvent(
    pointer('pointermove', {
      pointerId: 4,
      movementX: 3,
      movementY: 5,
      clientX: 8,
      clientY: 8,
    })
  )
  watcher.setRect(rect(100, 100, 20))
  document.dispatchEvent(
    pointer('pointermove', {
      pointerId: 4,
      movementX: 2,
      movementY: -1,
      clientX: 8,
      clientY: 8,
    })
  )
  document.dispatchEvent(pointer('pointerup', { pointerId: 999 }))
  document.dispatchEvent(pointer('pointerup', { pointerId: 4 }))

  assert.deepEqual(events, [
    ['move', 3, 5, 4],
    ['start', 'watcher'],
    ['move', 5, 4, 4],
    ['stop', 'watcher'],
  ])
  assert.equal(document.body.style.userSelect, '')
  assert.equal(dragged.hasPointerCapture(4), false)

  const nextWatcher = document.createElement('next-watcher')
  nextWatcher.setRect(rect(2, 2, 20))
  api.startWatch(watcher, dragged)
  api.startWatch(nextWatcher, dragged)
  api.drag(
    { target: dragged, pointerId: 5 },
    (_dragged, target) => events.push(['restart', target.id]),
    (_dragged, target) => events.push(['restop', target.id])
  )
  watcher.setRect(rect(0, 0, 20))
  document.setElementsFromPoint([watcher])
  document.dispatchEvent(
    pointer('pointermove', {
      pointerId: 5,
      clientX: 3,
      clientY: 3,
    })
  )
  document.setElementsFromPoint([nextWatcher])
  document.dispatchEvent(
    pointer('pointermove', {
      pointerId: 5,
      clientX: 3,
      clientY: 3,
    })
  )
  document.dispatchEvent(pointer('pointerup', { pointerId: 5 }))

  assert.deepEqual(events.slice(4), [
    ['restart', 'watcher'],
    ['restop', 'watcher'],
    ['restart', 'next-watcher'],
  ])
})

test('unit: SwapSet handles pointer swaps, replay, lookup, and listeners', async () => {
  const document = createDocument()
  const first = document.createElement('first')
  const second = document.createElement('second')
  const ignored = {}
  document.body.append(first, second)
  first.setRect(rect(0, 0, 20))
  second.setRect(rect(5, 5, 20))
  second.computedPosition = 'absolute'

  const swapSet = new api.SwapSet([first, ignored, second], 0)
  assert.equal(swapSet.members.length, 2)
  assert.equal(swapSet.getMemberById('second'), second)
  assert.equal(swapSet.getMemberById('missing'), undefined)

  const events = []
  const removed = () => events.push(['removed'])
  swapSet.addEventListener('drag', ({ detail }) =>
    events.push(['drag', detail.thisEl.id, detail.x, detail.y])
  )
  swapSet.addEventListener('swap', {
    handleEvent({ detail }) {
      events.push(['swap', detail.thisEl.id, detail.withEl.id])
    },
  })
  swapSet.addEventListener('settle', ({ detail }) =>
    events.push(['settle', detail.thisEl.id])
  )
  swapSet.addEventListener('drag', removed)
  swapSet.removeEventListener('drag', removed)

  first.animate()
  first.dispatchEvent(pointer('pointerdown', { pointerId: 1 }))
  document.setElementsFromPoint([second])
  document.dispatchEvent(
    pointer('pointermove', {
      pointerId: 1,
      movementX: 10,
      movementY: 15,
      clientX: 8,
      clientY: 8,
    })
  )
  document.setElementsFromPoint([])
  document.dispatchEvent(
    pointer('pointermove', {
      pointerId: 1,
      movementX: -2,
      movementY: 1,
      clientX: 80,
      clientY: 80,
    })
  )
  document.dispatchEvent(pointer('pointerup', { pointerId: 1 }))
  first.dispatchEvent(pointer('pointercancel', { pointerId: 1 }))
  await flushAnimations()

  assert.deepEqual(events, [
    ['drag', 'first', 10, 15],
    ['swap', 'first', 'second'],
    ['drag', 'first', 8, 16],
    ['settle', 'first'],
  ])
  assert.equal(first.dataset.dragging, undefined)
  assert.equal(second.dataset.dragonWatches, undefined)

  const remote = document.createElement('remote')
  const peer = document.createElement('peer')
  remote.setRect(rect(0, 0, 20))
  peer.setRect(rect(30, 0, 20))
  document.body.append(remote, peer)
  const replay = new api.SwapSet([remote, peer], 0)

  remote.animate()
  replay.remoteDrag({ thisEl: remote, x: 2, y: 4 })
  replay.remoteDrag({ thisEl: remote, x: 6, y: 8 })
  assert.equal(remote.style.transform, 'translate(6px, 8px)')
  replay.remoteSwap({ thisEl: remote, withEl: peer })
  replay.remoteSettle({ thisEl: remote })
  replay.remoteSettle({ thisEl: peer })
  replay.remoteSwap({
    thisEl: document.createElement('detached-a'),
    withEl: document.createElement('detached-b'),
  })
  await flushAnimations()
})

test('unit: DragTarget handles pointer commits, settles, replay, and guards', async () => {
  const document = createDocument()
  const dragged = document.createElement('dragged')
  const target = document.createElement('target')
  document.body.append(dragged, target)
  dragged.setRect(rect(0, 0, 20))
  target.setRect(rect(5, 5, 20))

  const replaceTarget = new api.DragTarget(dragged, [target], 'replace', 0)
  assert.equal(replaceTarget.getTargetById('target'), target)
  assert.equal(replaceTarget.getTargetById('missing'), undefined)

  const events = []
  const removed = () => events.push(['removed'])
  replaceTarget.addEventListener('drag', ({ detail }) =>
    events.push(['drag', detail.x, detail.y])
  )
  replaceTarget.addEventListener('intersecting', ({ detail }) =>
    events.push(['intersecting', detail.withEl.id])
  )
  replaceTarget.addEventListener('notintersecting', ({ detail }) =>
    events.push(['notintersecting', detail.withEl.id])
  )
  replaceTarget.addEventListener('swap', ({ detail }) =>
    events.push(['swap', detail.withEl.id])
  )
  replaceTarget.addEventListener('swap', removed)
  replaceTarget.removeEventListener('swap', removed)

  dragged.dispatchEvent(pointer('pointerdown', { pointerId: 2 }))
  document.setElementsFromPoint([target])
  document.dispatchEvent(
    pointer('pointermove', {
      pointerId: 2,
      movementX: 4,
      movementY: 5,
      clientX: 8,
      clientY: 8,
    })
  )
  target.setRect(rect(100, 100, 20))
  document.dispatchEvent(
    pointer('pointermove', {
      pointerId: 2,
      movementX: 1,
      movementY: 1,
      clientX: 8,
      clientY: 8,
    })
  )
  target.setRect(rect(5, 5, 20))
  document.dispatchEvent(
    pointer('pointermove', {
      pointerId: 2,
      movementX: 1,
      movementY: 1,
      clientX: 8,
      clientY: 8,
    })
  )
  document.dispatchEvent(pointer('pointerup', { pointerId: 2 }))
  dragged.dispatchEvent(pointer('pointerdown', { pointerId: 2 }))
  await flushAnimations()

  assert.deepEqual(events, [
    ['drag', 4, 5],
    ['intersecting', 'target'],
    ['drag', 5, 6],
    ['notintersecting', 'target'],
    ['drag', 6, 7],
    ['intersecting', 'target'],
    ['swap', 'target'],
  ])
  assert.equal(document.body.children.includes(target), false)

  const settleDragged = document.createElement('settle-dragged')
  const settleTarget = document.createElement('settle-target')
  document.body.append(settleDragged, settleTarget)
  const settle = new api.DragTarget(settleDragged, settleTarget, 'append', 0)
  const settleEvents = []
  settle.addEventListener('settle', ({ detail }) =>
    settleEvents.push(detail.thisEl.id)
  )
  settleDragged.dispatchEvent(pointer('pointerdown', { pointerId: 3 }))
  document.setElementsFromPoint([])
  document.dispatchEvent(
    pointer('pointermove', {
      pointerId: 3,
      movementX: 7,
      movementY: 9,
      clientX: 300,
      clientY: 300,
    })
  )
  document.dispatchEvent(pointer('pointercancel', { pointerId: 3 }))
  await flushAnimations()
  assert.deepEqual(settleEvents, ['settle-dragged'])

  const appendDragged = document.createElement('append-dragged')
  const appendTarget = document.createElement('append-target')
  document.body.append(appendDragged, appendTarget)
  appendDragged.setRect(rect(0, 0, 20))
  appendTarget.setRect(rect(5, 5, 20))
  new api.DragTarget(appendDragged, appendTarget, 'append', 0)
  appendDragged.dispatchEvent(pointer('pointerdown', { pointerId: 4 }))
  document.setElementsFromPoint([appendTarget])
  document.dispatchEvent(
    pointer('pointermove', {
      pointerId: 4,
      movementX: 2,
      movementY: 2,
      clientX: 8,
      clientY: 8,
    })
  )
  document.dispatchEvent(pointer('pointerup', { pointerId: 4 }))
  await flushAnimations()
  assert.equal(appendTarget.children.includes(appendDragged), true)

  const guardedDragged = document.createElement('guarded-dragged')
  const guardedTarget = document.createElement('guarded-target')
  const guarded = new api.DragTarget(guardedDragged, guardedTarget, 'append', 0)
  guarded.used = true
  guardedDragged.dispatchEvent(pointer('pointerdown', { pointerId: 5 }))

  const guardedStopDragged = document.createElement('guarded-stop-dragged')
  const guardedStopTarget = document.createElement('guarded-stop-target')
  const guardedStop = new api.DragTarget(
    guardedStopDragged,
    guardedStopTarget,
    'append',
    0
  )
  guardedStopDragged.dispatchEvent(pointer('pointerdown', { pointerId: 6 }))
  guardedStop.used = true
  guardedStopDragged.dispatchEvent(pointer('pointerup', { pointerId: 6 }))

  const replayDragged = document.createElement('replay-dragged')
  const replayTarget = document.createElement('replay-target')
  const other = document.createElement('other')
  document.body.append(replayDragged, replayTarget, other)
  const replay = new api.DragTarget(replayDragged, [replayTarget], 'append', 0)

  replay.remoteDrag({ thisEl: other, x: 1, y: 1 })
  replayDragged.animate()
  replay.remoteDrag({ thisEl: replayDragged, x: 2, y: 3 })
  replay.remoteDrag({ thisEl: replayDragged, x: 4, y: 5 })
  assert.equal(replayDragged.style.transform, 'translate(4px, 5px)')
  replay.remoteSettle({ thisEl: other })
  replay.remoteSettle({ thisEl: replayDragged })
  replay.remoteSettle({ thisEl: replayDragged })
  replay.remoteSwap({ thisEl: other, withEl: replayTarget })
  replay.remoteSwap({ thisEl: replayDragged, withEl: other })
  replay.remoteSwap({ thisEl: replayDragged, withEl: replayTarget })
  replay.remoteDrag({ thisEl: replayDragged, x: 6, y: 7 })
  replay.remoteSwap({ thisEl: replayDragged, withEl: replayTarget })
  replay.remoteSettle({ thisEl: replayDragged })
  await flushAnimations()

  assert.equal(replayTarget.children.includes(replayDragged), true)

  const remoteReplaceDragged = document.createElement('remote-replace-dragged')
  const remoteReplaceTarget = document.createElement('remote-replace-target')
  document.body.append(remoteReplaceDragged, remoteReplaceTarget)
  new api.DragTarget(
    remoteReplaceDragged,
    remoteReplaceTarget,
    'replace',
    0
  ).remoteSwap({
    thisEl: remoteReplaceDragged,
    withEl: remoteReplaceTarget,
  })
  await flushAnimations()
  assert.equal(document.body.children.includes(remoteReplaceTarget), false)
})

test('unit: animation AbortError is ignored and unexpected animation errors surface', () => {
  const script = `
    import { pathToFileURL } from 'node:url'
    const helperUrl = ${JSON.stringify(
      pathToFileURL('test/unit/fake-dom.js').href
    )}
    const distUrl = ${JSON.stringify(pathToFileURL('dist/index.js').href)}
    const { createDocument, installFakeDom, flushAnimations } = await import(helperUrl)
    installFakeDom()
    const api = await import(distUrl)
    const seen = []
    process.on('unhandledRejection', (error) => seen.push(error.message))
    const document = createDocument()
    const returned = document.createElement('returned')
    returned.animationOutcomes.push(new DOMException('cancelled', 'AbortError'))
    new api.SwapSet([returned], 0).remoteSettle({ thisEl: returned })
    const failedReturn = document.createElement('failed-return')
    failedReturn.animationOutcomes.push(new Error('return failed'))
    new api.SwapSet([failedReturn], 0).remoteSettle({ thisEl: failedReturn })
    const dragged = document.createElement('dragged')
    const target = document.createElement('target')
    const failedDrop = document.createElement('failed-drop')
    const failedTarget = document.createElement('failed-target')
    dragged.animationOutcomes.push(new DOMException('cancelled', 'AbortError'))
    failedDrop.animationOutcomes.push(new Error('drop failed'))
    new api.DragTarget(dragged, target, 'append', 0).remoteSwap({ thisEl: dragged, withEl: target })
    new api.DragTarget(failedDrop, failedTarget, 'append', 0).remoteSwap({ thisEl: failedDrop, withEl: failedTarget })
    await flushAnimations()
    await new Promise((resolve) => setTimeout(resolve, 10))
    if (seen.join(',') !== 'return failed,drop failed') {
      console.error(seen)
      process.exit(1)
    }
  `
  const result = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', script],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: process.env,
    }
  )

  assert.equal(result.status, 0, result.stderr || result.stdout)
})
