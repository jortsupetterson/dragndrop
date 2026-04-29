import { drag } from '../drag/index.js'

export function stopDrag(pointerupEvent: PointerEvent): void {
  const target = pointerupEvent.currentTarget
  if (!(target instanceof HTMLElement)) return

  target.removeEventListener('pointermove', drag)
  target.removeEventListener('pointerup', stopDrag)
  target.removeEventListener('pointercancel', stopDrag)

  if (target.hasPointerCapture(pointerupEvent.pointerId)) {
    target.releasePointerCapture(pointerupEvent.pointerId)
  }
}
