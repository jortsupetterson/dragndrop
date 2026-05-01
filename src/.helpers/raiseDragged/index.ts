import type { RestoredDragStyle } from '../../.types/types.js'

/**
 * Raises a dragged element above surrounding content.
 *
 * @param dragged The element to raise.
 * @returns The inline style values that should be restored later.
 */
export function raiseDragged(dragged: HTMLElement): RestoredDragStyle {
  const restoredStyle = {
    position: dragged.style.position,
    transform: dragged.style.transform,
    transition: dragged.style.transition,
    zIndex: dragged.style.zIndex,
  }
  if (
    dragged.ownerDocument.defaultView?.getComputedStyle(dragged).position ===
    'static'
  )
    dragged.style.position = 'relative'
  dragged.style.zIndex = '2147483647'
  return restoredStyle
}
