export function drag(pointermoveEvent: PointerEvent): void {
  const target = pointermoveEvent.currentTarget
  if (!(target instanceof HTMLElement)) return

  const x = Number(target.dataset.x ?? 0) + pointermoveEvent.movementX
  const y = Number(target.dataset.y ?? 0) + pointermoveEvent.movementY

  target.dataset.x = String(x)
  target.dataset.y = String(y)
  target.style.transform = `translate(${x}px, ${y}px)`
}
