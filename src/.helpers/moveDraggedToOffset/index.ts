/**
 * Applies a translate offset to a dragged element.
 *
 * @param dragged The element to move.
 * @param x The horizontal translate offset, in CSS pixels.
 * @param y The vertical translate offset, in CSS pixels.
 */
export function moveDraggedToOffset(
  dragged: HTMLElement,
  x: number,
  y: number
): void {
  dragged.dataset.x = String(x)
  dragged.dataset.y = String(y)
  dragged.style.transform = `translate(${x}px, ${y}px)`
}
