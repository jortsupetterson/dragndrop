/**
 * Marks an element as watching another element during drag intersection checks.
 *
 * @param watcher The element that should be discoverable as a watcher.
 * @param elementToWatch The element whose drag identifier should be watched.
 */
export function startWatch(
  watcher: HTMLElement,
  elementToWatch: HTMLElement
): void {
  const id = elementToWatch.dataset.dragonwatchId ?? crypto.randomUUID()
  elementToWatch.dataset.dragonwatchId = id
  watcher.dataset.dragonWatches = id
}

/**
 * Stops an element from watching another element.
 *
 * @param watcher The element currently registered as a watcher.
 * @param elementToWatch The element whose drag identifier should no longer be watched.
 */
export function stopWatch(
  watcher: HTMLElement,
  elementToWatch: HTMLElement
): void {
  if (watcher.dataset.dragonWatches === elementToWatch.dataset.dragonwatchId)
    delete watcher.dataset.dragonWatches
}
