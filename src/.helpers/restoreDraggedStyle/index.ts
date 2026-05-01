import type { RestoredDragStyle } from '../../.types/types.js'

/**
 * Restores inline style values captured before dragging.
 *
 * @param dragged The element whose inline styles should be restored.
 * @param restoredStyle The style values to restore.
 */
export function restoreDraggedStyle(
  dragged: HTMLElement,
  restoredStyle: RestoredDragStyle
): void {
  dragged.style.position = restoredStyle.position
  dragged.style.transform = restoredStyle.transform
  dragged.style.transition = restoredStyle.transition
  dragged.style.zIndex = restoredStyle.zIndex
}
