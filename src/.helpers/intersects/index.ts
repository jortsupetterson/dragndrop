/**
 * Returns whether two elements' bounding rectangles intersect.
 *
 * @param a The first element to compare.
 * @param b The second element to compare.
 * @returns `true` if the elements' bounding rectangles overlap.
 */
export function intersects(a: HTMLElement, b: HTMLElement): boolean {
  const ar = a.getBoundingClientRect()
  const br = b.getBoundingClientRect()

  return !(
    ar.right < br.left ||
    ar.left > br.right ||
    ar.bottom < br.top ||
    ar.top > br.bottom
  )
}
