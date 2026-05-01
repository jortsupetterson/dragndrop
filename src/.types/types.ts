/**
 * Receives a dragged element and the watched element it intersects.
 *
 * @param dragged The element being moved by the active pointer interaction.
 * @param watcher The element registered as watching the dragged element.
 */
export type IntersectionCallback = (
  dragged: HTMLElement,
  watcher: HTMLElement
) => void

/**
 * Receives movement updates for an active drag operation.
 *
 * @param dragged The element being moved by the active pointer interaction.
 * @param offset The current translate offset for the dragged element.
 * @param pointerEvent The pointer event that produced the movement.
 */
export type DragMoveCallback = (
  dragged: HTMLElement,
  offset: DragInstruction,
  pointerEvent: PointerEvent
) => void

/**
 * Describes a dragged element at a specific translate offset.
 */
export type DragInstruction = {
  /**
   * The element the instruction applies to.
   */
  thisEl: HTMLElement

  /**
   * The horizontal translate offset, in CSS pixels.
   */
  x: number

  /**
   * The vertical translate offset, in CSS pixels.
   */
  y: number
}

/**
 * Provides detail for drag movement events.
 */
export type DragEventDetail = DragInstruction & {
  /**
   * The pointer event that produced the movement.
   */
  pointerEvent: PointerEvent
}

/**
 * Identifies two elements participating in a swap or target intersection.
 */
export type SwapEventDetail = {
  /**
   * The element initiating the operation.
   */
  thisEl: HTMLElement

  /**
   * The element paired with `thisEl` for the operation.
   */
  withEl: HTMLElement
}

/**
 * Identifies the element that settled after a drag operation.
 */
export type SettleEventDetail = {
  /**
   * The element that returned to its settled position.
   */
  thisEl: HTMLElement
}

/**
 * Event detail types emitted by {@link SwapSet}.
 */
export type SwapSetEventMap = {
  /**
   * Fired when a member moves during an active pointer drag.
   */
  drag: DragEventDetail

  /**
   * Fired when a member returns to its settled position after dragging.
   */
  settle: SettleEventDetail

  /**
   * Fired when the dragged member swaps with another member.
   */
  swap: SwapEventDetail
}

/**
 * Handles a typed {@link SwapSet} custom event.
 *
 * @typeParam K The swap set event type.
 */
export type SwapSetEventListener<K extends keyof SwapSetEventMap> =
  | ((event: CustomEvent<SwapSetEventMap[K]>) => void)
  | { handleEvent(event: CustomEvent<SwapSetEventMap[K]>): void }

/**
 * Event listener type selected by swap set event name.
 *
 * @typeParam K The swap set event type.
 */
export type SwapSetEventListenerFor<K extends keyof SwapSetEventMap> =
  SwapSetEventListener<K>

/**
 * Controls how a dragged element is committed to an accepted target.
 */
export type DragTargetAction = 'append' | 'replace'

/**
 * Event detail types emitted by {@link DragTarget}.
 */
export type DragTargetEventMap = {
  /**
   * Fired when the dragged element moves during an active pointer drag.
   */
  drag: DragEventDetail

  /**
   * Fired when the dragged element begins intersecting a target.
   */
  intersecting: SwapEventDetail

  /**
   * Fired when the dragged element stops intersecting a target.
   */
  notintersecting: SwapEventDetail

  /**
   * Fired when the dragged element returns to its settled position.
   */
  settle: SettleEventDetail

  /**
   * Fired when the dragged element is committed to a target.
   */
  swap: SwapEventDetail
}

/**
 * Handles a typed {@link DragTarget} custom event.
 *
 * @typeParam K The drag target event type.
 */
export type DragTargetEventListener<K extends keyof DragTargetEventMap> =
  | ((event: CustomEvent<DragTargetEventMap[K]>) => void)
  | { handleEvent(event: CustomEvent<DragTargetEventMap[K]>): void }

/**
 * Event listener type selected by drag target event name.
 *
 * @typeParam K The drag target event type.
 */
export type DragTargetEventListenerFor<K extends keyof DragTargetEventMap> =
  DragTargetEventListener<K>

/**
 * Commits a DOM mutation after a drop animation reaches its target.
 */
export type DropCommit = () => void

/**
 * Captures inline styles that are restored after a drag operation.
 */
export type RestoredDragStyle = {
  /**
   * The previous inline `position` value.
   */
  position: string

  /**
   * The previous inline `transform` value.
   */
  transform: string

  /**
   * The previous inline `transition` value.
   */
  transition: string

  /**
   * The previous inline `z-index` value.
   */
  zIndex: string
}
