export function moveDraggedToOffset(
  dragged: HTMLElement,
  x: number,
  y: number
): void {
  dragged.dataset.x = String(x)
  dragged.dataset.y = String(y)
  dragged.style.transform = `translate(${x}px, ${y}px)`
}
