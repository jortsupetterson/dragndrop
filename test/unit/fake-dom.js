import assert from 'node:assert/strict'

class FakeAnimation {
  constructor(outcome) {
    this.cancelled = false
    if (outcome instanceof Error || outcome instanceof DOMException)
      this.finished = Promise.reject(outcome)
    else this.finished = Promise.resolve()
  }

  cancel() {
    this.cancelled = true
  }
}

class FakeTextNode {
  constructor(ownerDocument) {
    this.ownerDocument = ownerDocument
    this.parentNode = null
  }

  remove() {
    this.parentNode?.removeChild(this)
  }
}

export class FakeHTMLElement extends EventTarget {
  constructor(ownerDocument, id = '') {
    super()
    this.ownerDocument = ownerDocument
    this.id = id
    this.className = ''
    this.textContent = ''
    this.dataset = {}
    this.style = {
      position: '',
      transform: '',
      transition: '',
      userSelect: '',
      zIndex: '',
    }
    this.parentNode = null
    this.childNodes = []
    this.computedPosition = 'static'
    this.rect = { left: 0, top: 0, right: 10, bottom: 10 }
    this.animationOutcomes = []
    this.animations = []
    this.capturedPointers = new Set()
  }

  get children() {
    return this.childNodes.filter((node) => node instanceof FakeHTMLElement)
  }

  append(...nodes) {
    for (const node of nodes) this.appendChild(node)
  }

  appendChild(node) {
    node.parentNode?.removeChild(node)
    node.parentNode = this
    this.childNodes.push(node)
    return node
  }

  insertBefore(node, referenceNode) {
    node.parentNode?.removeChild(node)
    node.parentNode = this
    const index = referenceNode ? this.childNodes.indexOf(referenceNode) : -1
    if (index === -1) this.childNodes.push(node)
    else this.childNodes.splice(index, 0, node)
    return node
  }

  removeChild(node) {
    const index = this.childNodes.indexOf(node)
    assert.notEqual(index, -1)
    this.childNodes.splice(index, 1)
    node.parentNode = null
    return node
  }

  replaceChildren(...nodes) {
    for (const node of [...this.childNodes]) this.removeChild(node)
    this.append(...nodes)
  }

  replaceWith(node) {
    assert.ok(this.parentNode)
    this.parentNode.insertBefore(node, this)
    this.remove()
  }

  remove() {
    this.parentNode?.removeChild(this)
  }

  getBoundingClientRect() {
    return this.rect
  }

  setRect(rect) {
    this.rect = rect
  }

  animate() {
    const animation = new FakeAnimation(this.animationOutcomes.shift())
    this.animations.push(animation)
    return animation
  }

  getAnimations() {
    return this.animations
  }

  setPointerCapture(pointerId) {
    this.capturedPointers.add(pointerId)
  }

  hasPointerCapture(pointerId) {
    return this.capturedPointers.has(pointerId)
  }

  releasePointerCapture(pointerId) {
    this.capturedPointers.delete(pointerId)
  }
}

export class FakeDocument extends EventTarget {
  constructor() {
    super()
    this.body = new FakeHTMLElement(this, 'body')
    this.elementsAtPoint = []
    this.defaultView = {
      getComputedStyle: (element) => ({ position: element.computedPosition }),
    }
  }

  createElement(id = '') {
    return new FakeHTMLElement(this, id)
  }

  createTextNode() {
    return new FakeTextNode(this)
  }

  elementsFromPoint() {
    return this.elementsAtPoint
  }

  setElementsFromPoint(elements) {
    this.elementsAtPoint = elements
  }
}

export class FakePointerEvent extends Event {
  constructor(type, init = {}) {
    super(type)
    this.pointerId = init.pointerId ?? 1
    this.clientX = init.clientX ?? 0
    this.clientY = init.clientY ?? 0
    this.movementX = init.movementX ?? 0
    this.movementY = init.movementY ?? 0
  }
}

export function installFakeDom() {
  globalThis.HTMLElement = FakeHTMLElement
  globalThis.PointerEvent = FakePointerEvent
}

export function createDocument() {
  return new FakeDocument()
}

export async function flushAnimations() {
  await Promise.resolve()
  await Promise.resolve()
}
