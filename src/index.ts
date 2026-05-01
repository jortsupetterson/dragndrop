/**
 * Pointer-driven drag and watch primitives for browser DOM elements.
 *
 * @packageDocumentation
 */

export type {
  DragEventDetail,
  DragInstruction,
  DragMoveCallback,
  DragTargetAction,
  DragTargetEventListener,
  DragTargetEventListenerFor,
  DragTargetEventMap,
  IntersectionCallback,
  SettleEventDetail,
  SwapSetEventListener,
  SwapSetEventListenerFor,
  SwapSetEventMap,
  SwapEventDetail,
} from './.types/types.js'
export { DragTarget } from './DragTarget/class.js'
export { SwapSet } from './SwapSet/class.js'
export { drag } from './drag/index.js'
export { startWatch, stopWatch } from './watch/index.js'
