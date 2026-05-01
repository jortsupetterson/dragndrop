import {
  moveDraggedToOffset,
  raiseDragged,
  returnDraggedToStart,
  swapDraggedWithWatcher,
} from '../.helpers/index.js'
import type {
  DragInstruction,
  RestoredDragStyle,
  SwapSetEventListenerFor,
  SwapSetEventMap,
  SwapEventDetail,
} from '../.types/types.js'
import { drag } from '../drag/index.js'
import { startWatch, stopWatch } from '../watch/index.js'

/**
 * Coordinates pointer dragging for a set of interchangeable DOM elements.
 *
 * `SwapSet` swaps members when the dragged member intersects another member
 * and emits typed events that can be replayed against another set.
 */
export class SwapSet {
  /**
   * The draggable members managed by this set.
   */
  public readonly members: readonly HTMLElement[]
  private readonly eventTarget = new EventTarget()
  private readonly restoredStyles = new Map<HTMLElement, RestoredDragStyle>()

  /**
   * Creates a swap set from the provided elements.
   *
   * @param elements Elements to include; non-HTMLElement values are ignored.
   * @param animationDuration The duration of generated animations, in milliseconds.
   */
  constructor(
    elements: Iterable<Element>,
    private readonly animationDuration: number = 200
  ) {
    this.members = Array.from(elements).filter(
      (element): element is HTMLElement => element instanceof HTMLElement
    )

    for (const item of this.members) {
      void item.addEventListener('pointerdown', (event) => {
        const restoredStyle = raiseDragged(item)
        for (const animation of item.getAnimations()) animation.cancel()
        item.dataset.dragging = 'true'
        item.style.transition = 'none'
        void drag(
          event,
          (dragged, watcher) => {
            void swapDraggedWithWatcher(
              dragged,
              watcher,
              this.animationDuration
            )
            void this.eventTarget.dispatchEvent(
              new CustomEvent<SwapSetEventMap['swap']>('swap', {
                detail: { thisEl: dragged, withEl: watcher },
              })
            )
          },
          undefined,
          (_dragged, { thisEl, x, y }, pointerEvent) => {
            void this.eventTarget.dispatchEvent(
              new CustomEvent<SwapSetEventMap['drag']>('drag', {
                detail: { pointerEvent, thisEl, x, y },
              })
            )
          }
        )
        for (const other of this.members)
          if (other !== item) void startWatch(other, item)

        const stop = (): void => {
          if (item.dataset.dragging !== 'true') return
          delete item.dataset.dragging
          void returnDraggedToStart(item, this.animationDuration, restoredStyle)
          void this.eventTarget.dispatchEvent(
            new CustomEvent<SwapSetEventMap['settle']>('settle', {
              detail: { thisEl: item },
            })
          )
          for (const other of this.members)
            if (other !== item) void stopWatch(other, item)
        }

        void item.addEventListener('pointerup', stop, { once: true })
        void item.addEventListener('pointercancel', stop, { once: true })
      })
    }
  }

  /**
   * Replays a drag movement against one managed member.
   *
   * @param instruction The member and translate offset to apply.
   */
  remoteDrag({ thisEl, x, y }: DragInstruction): void {
    for (const animation of thisEl.getAnimations()) animation.cancel()
    if (!this.restoredStyles.has(thisEl)) {
      void this.restoredStyles.set(thisEl, raiseDragged(thisEl))
      thisEl.style.transition = 'none'
    }
    void moveDraggedToOffset(thisEl, x, y)
  }

  /**
   * Replays a member swap.
   *
   * @param swap The member and peer element to swap.
   */
  remoteSwap({ thisEl, withEl }: SwapEventDetail): void {
    void swapDraggedWithWatcher(thisEl, withEl, this.animationDuration)
  }

  /**
   * Replays the end of a drag operation for one managed member.
   *
   * @param event The settle event detail to apply.
   */
  remoteSettle({ thisEl }: SwapSetEventMap['settle']): void {
    const restoredStyle = this.restoredStyles.get(thisEl)
    void this.restoredStyles.delete(thisEl)
    void returnDraggedToStart(thisEl, this.animationDuration, restoredStyle)
  }

  /**
   * Returns the first managed member with the given element id.
   *
   * @param id The element id to match.
   * @returns The matching member, or `undefined` if no member matches.
   */
  getMemberById(id: string): HTMLElement | undefined {
    return this.members.find((member) => member.id === id)
  }

  /**
   * Appends an event listener for events whose type is `type`.
   *
   * @param type The swap set event type to listen for.
   * @param listener The callback or event listener object that receives the event.
   * @param options Options that control listener registration.
   */
  addEventListener<K extends keyof SwapSetEventMap>(
    type: K,
    listener: SwapSetEventListenerFor<K> | null,
    options?: boolean | AddEventListenerOptions
  ): void {
    void this.eventTarget.addEventListener(
      type,
      listener as EventListenerOrEventListenerObject | null,
      options
    )
  }

  /**
   * Removes an event listener previously registered with {@link addEventListener}.
   *
   * @param type The swap set event type.
   * @param listener The callback or event listener object to remove.
   * @param options Options that identify the listener registration.
   */
  removeEventListener<K extends keyof SwapSetEventMap>(
    type: K,
    listener: SwapSetEventListenerFor<K> | null,
    options?: boolean | EventListenerOptions
  ): void {
    void this.eventTarget.removeEventListener(
      type,
      listener as EventListenerOrEventListenerObject | null,
      options
    )
  }
}
