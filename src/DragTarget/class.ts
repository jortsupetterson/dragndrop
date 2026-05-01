import {
  dropDraggedOnTarget,
  moveDraggedToOffset,
  raiseDragged,
  returnDraggedToStart,
} from '../.helpers/index.js'
import type {
  DragInstruction,
  DragTargetAction,
  DragTargetEventListenerFor,
  DragTargetEventMap,
  RestoredDragStyle,
  SwapEventDetail,
} from '../.types/types.js'
import { drag } from '../drag/index.js'
import { startWatch, stopWatch } from '../watch/index.js'

/**
 * Coordinates pointer dragging from one DOM element into one or more targets.
 *
 * `DragTarget` commits at most once. A committed drag either appends the
 * dragged element to the target or replaces the target, depending on action.
 */
export class DragTarget {
  /**
   * The target elements that can accept the dragged element.
   */
  public readonly targets: readonly HTMLElement[]

  private readonly abortController = new AbortController()
  private readonly eventTarget = new EventTarget()
  private readonly restoredStyles = new Map<HTMLElement, RestoredDragStyle>()
  private used = false

  /**
   * Creates a drag target interaction.
   *
   * @param dragged The element users can drag.
   * @param targets One target element, or an iterable of target elements.
   * @param action The DOM operation to perform when a target accepts the drag.
   * @param animationDuration The duration of generated animations, in milliseconds.
   */
  constructor(
    public readonly dragged: HTMLElement,
    targets: HTMLElement | Iterable<HTMLElement>,
    private readonly action: DragTargetAction,
    private readonly animationDuration: number = 200
  ) {
    this.targets =
      targets instanceof HTMLElement ? [targets] : Array.from(targets)

    void this.dragged.addEventListener(
      'pointerdown',
      (event) => {
        if (this.used) return
        let activeTarget: HTMLElement | undefined
        for (const target of this.targets) void startWatch(target, this.dragged)
        void drag(
          event,
          (_dragged, target) => {
            activeTarget = target
            void this.eventTarget.dispatchEvent(
              new CustomEvent<DragTargetEventMap['intersecting']>(
                'intersecting',
                {
                  detail: { thisEl: this.dragged, withEl: target },
                }
              )
            )
          },
          (_dragged, target) => {
            if (activeTarget === target) activeTarget = undefined
            void this.eventTarget.dispatchEvent(
              new CustomEvent<DragTargetEventMap['notintersecting']>(
                'notintersecting',
                {
                  detail: { thisEl: this.dragged, withEl: target },
                }
              )
            )
          },
          (_dragged, { thisEl, x, y }, pointerEvent) => {
            void this.eventTarget.dispatchEvent(
              new CustomEvent<DragTargetEventMap['drag']>('drag', {
                detail: { pointerEvent, thisEl, x, y },
              })
            )
          }
        )

        const stop = (): void => {
          if (this.used) return
          for (const target of this.targets)
            void stopWatch(target, this.dragged)
          const target = activeTarget
          if (target) {
            this.used = true
            void this.abortController.abort()
            void dropDraggedOnTarget(
              this.dragged,
              target,
              () => {
                if (this.action === 'replace')
                  void target.replaceWith(this.dragged)
                else void target.appendChild(this.dragged)
                void this.eventTarget.dispatchEvent(
                  new CustomEvent<DragTargetEventMap['swap']>('swap', {
                    detail: { thisEl: this.dragged, withEl: target },
                  })
                )
              },
              this.animationDuration
            )
          } else {
            void returnDraggedToStart(this.dragged, this.animationDuration)
            void this.eventTarget.dispatchEvent(
              new CustomEvent<DragTargetEventMap['settle']>('settle', {
                detail: { thisEl: this.dragged },
              })
            )
          }
          activeTarget = undefined
        }

        void this.dragged.addEventListener('pointerup', stop, {
          once: true,
          signal: this.abortController.signal,
        })
        void this.dragged.addEventListener('pointercancel', stop, {
          once: true,
          signal: this.abortController.signal,
        })
      },
      { signal: this.abortController.signal }
    )
  }

  /**
   * Replays a drag movement for the managed dragged element.
   *
   * @param instruction The dragged element and translate offset to apply.
   */
  remoteDrag({ thisEl, x, y }: DragInstruction): void {
    if (this.used || thisEl !== this.dragged) return
    for (const animation of thisEl.getAnimations()) animation.cancel()
    if (!this.restoredStyles.has(thisEl)) {
      void this.restoredStyles.set(thisEl, raiseDragged(thisEl))
      thisEl.style.transition = 'none'
    }
    void moveDraggedToOffset(thisEl, x, y)
  }

  /**
   * Replays a committed drop onto a target.
   *
   * @param swap The dragged element and target element to commit.
   */
  remoteSwap({ thisEl, withEl }: SwapEventDetail): void {
    if (this.used || thisEl !== this.dragged) return
    const target = this.targets.find((target) => target === withEl)
    if (!target) return
    this.used = true
    const restoredStyle = this.restoredStyles.get(thisEl)
    void this.restoredStyles.delete(thisEl)
    for (const watchedTarget of this.targets)
      void stopWatch(watchedTarget, this.dragged)
    void this.abortController.abort()
    void dropDraggedOnTarget(
      thisEl,
      target,
      () => {
        if (this.action === 'replace') void target.replaceWith(thisEl)
        else void target.appendChild(thisEl)
      },
      this.animationDuration,
      restoredStyle
    )
  }

  /**
   * Replays the end of an uncommitted drag operation.
   *
   * @param event The settle event detail to apply.
   */
  remoteSettle({ thisEl }: DragTargetEventMap['settle']): void {
    if (this.used || thisEl !== this.dragged) return
    const restoredStyle = this.restoredStyles.get(thisEl)
    void this.restoredStyles.delete(thisEl)
    void returnDraggedToStart(thisEl, this.animationDuration, restoredStyle)
  }

  /**
   * Returns the first target with the given element id.
   *
   * @param id The element id to match.
   * @returns The matching target, or `undefined` if no target matches.
   */
  getTargetById(id: string): HTMLElement | undefined {
    return this.targets.find((target) => target.id === id)
  }

  /**
   * Appends an event listener for events whose type is `type`.
   *
   * @param type The drag target event type to listen for.
   * @param listener The callback or event listener object that receives the event.
   * @param options Options that control listener registration.
   */
  addEventListener<K extends keyof DragTargetEventMap>(
    type: K,
    listener: DragTargetEventListenerFor<K> | null,
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
   * @param type The drag target event type.
   * @param listener The callback or event listener object to remove.
   * @param options Options that identify the listener registration.
   */
  removeEventListener<K extends keyof DragTargetEventMap>(
    type: K,
    listener: DragTargetEventListenerFor<K> | null,
    options?: boolean | EventListenerOptions
  ): void {
    void this.eventTarget.removeEventListener(
      type,
      listener as EventListenerOrEventListenerObject | null,
      options
    )
  }
}
