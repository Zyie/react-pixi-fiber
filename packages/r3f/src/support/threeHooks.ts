/**
 * @fileoverview The renderer hooks of three's supports (webgl.ts, webgpu.ts)
 *
 * What core did with three's objects before it asked a support, moved here as it was. It reads
 * three's members by duck typing and imports nothing from three, so both supports share it.
 */

import type { Intersection, RendererHooks, RootState } from '#types'
import { isObject3D } from '../core/utils/is'

export const threeHooks: RendererHooks = {
  add(parent: any, child: any, before?: any) {
    const childIndex = parent.children.indexOf(before)
    if (before && childIndex !== -1) {
      // If the child is already in the parent's children array, move it to the new position
      // Otherwise, just insert it at the target position
      const existingIndex = parent.children.indexOf(child)
      if (existingIndex !== -1) {
        parent.children.splice(existingIndex, 1)
        const adjustedIndex = existingIndex < childIndex ? childIndex - 1 : childIndex
        parent.children.splice(adjustedIndex, 0, child)
      } else {
        child.parent = parent
        parent.children.splice(childIndex, 0, child)
        child.dispatchEvent({ type: 'added' })
        parent.dispatchEvent({ type: 'childadded', child })
      }
    } else {
      parent.add(child)
    }
  },

  remove(parent: any, child: any) {
    parent.remove(child)
  },

  isInteractive: isObject3D,

  defaultAttach(object: any) {
    if (object.isBufferGeometry) return 'geometry'
    if (object.isMaterial) return 'material'
    return undefined
  },

  // three's objects take every prop by assignment, so core writes them all
  applyProp: () => false,

  hitTest(object: any, _event, state: RootState) {
    // Bring world matrices up to date before intersecting. three's raycaster reads `matrixWorld`
    // and never refreshes it -- it assumes the render loop already has. That assumption breaks for
    // any event arriving between a React commit and the next rendered frame: the object has its
    // new `position`, its `matrixWorld` still says otherwise, and the hit is computed against
    // where it used to be. Two objects that have not been rendered yet both report the origin, so
    // their distances tie and "nearest first" silently degrades into scene order.
    //
    // `updateWorldMatrix(true, true)` walks ancestors first, then descendants, so a nested object
    // is correct even when its parent is what moved. Cheap in the common case -- three skips the
    // maths for anything not flagged dirty.
    object.updateWorldMatrix(true, true)
    return state.raycaster.intersectObject(object, true)
  },

  compareHits(a: Intersection, b: Intersection) {
    return a.distance - b.distance
  },

  dispose(object: any) {
    if (typeof object.dispose === 'function') object.dispose()
  },
}
