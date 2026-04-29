import { drag } from '../drag/index.js'
import { stopDrag } from '../stopDrag/index.js'

export function startDrag(pointerEvent: PointerEvent): void {
  const target = pointerEvent.target
  if (!(target instanceof HTMLElement)) return

  target.setPointerCapture(pointerEvent.pointerId)
  target.addEventListener('pointermove', drag)
  target.addEventListener('pointercancel', stopDrag)
}
