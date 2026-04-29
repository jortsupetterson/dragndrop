import { drag } from '../drag/index.js'
import { stopDrag } from '../stopDrag/index.js'

export function startDrag(pointerdownEvent: PointerEvent): void {
  const target = pointerdownEvent.target
  if (!(target instanceof HTMLElement)) return

  target.setPointerCapture(pointerdownEvent.pointerId)
  target.addEventListener('pointermove', drag)
  target.addEventListener('pointerup', stopDrag)
  target.addEventListener('pointercancel', stopDrag)
}
