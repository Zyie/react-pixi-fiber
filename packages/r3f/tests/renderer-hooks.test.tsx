/**
 * @fileoverview A renderer support that isn't three's
 *
 * Core asks the root's support wherever it reached into three's objects, and three's supports answer with
 * what core did before (src/support/threeHooks.ts), so every other test runs through three's answers. The
 * support here is another renderer's: kind 'custom', a scene graph of plain `Node`s, a `Shape` that
 * attaches by default, a `Panel` whose `title` prop and `badge-N` attaches the renderer writes itself, and
 * a spy on every hook. Core still builds its raycaster, default camera, pointer and frustum from `three`.
 */
import * as React from 'react'
import { act } from 'react'
import * as THREE from 'three'
import { vi } from 'vitest'
import { createCanvas } from '../../test-renderer/src/createTestCanvas'
import { createRoot } from '../src/core/root'
import { createPointerEvents } from '../src/core/events'
import type { BaseRendererSupport, Hit } from '../types/provider'
import type { ReconcilerRoot, RootStore } from '#types'

//* A Renderer of Its Own ==============================

class Node {
  children: object[] = []
  parent: Node | null = null
  visible = true
  depth = 0
  shape: Shape | null = null
}

class Scene extends Node {
  isScene = true
}

class Shape {}

class Panel extends Node {
  titles: string[] = []
  badges: (object | undefined)[] = []
}

class Renderer {
  constructor(readonly parameters: object) {}
  async init() {}
  setSize() {}
  setPixelRatio() {}
  render() {}
  dispose() {}
}

const BADGE = /^badge-(\d+)$/

function createSupport() {
  return {
    kind: 'custom',
    three: { ...THREE, Scene },
    catalog: { Node, Shape, Panel },
    Renderer,
    add: vi.fn((parent: object, child: object, before?: object) => {
      const node = parent as Node
      const current = node.children.indexOf(child)
      if (current !== -1) node.children.splice(current, 1)
      const index = before ? node.children.indexOf(before) : -1
      node.children.splice(index === -1 ? node.children.length : index, 0, child)
      // The default camera is three's, from `three`, and keeps three's parent
      if (child instanceof Node) child.parent = node
    }),
    remove: vi.fn((parent: object, child: object) => {
      const node = parent as Node
      node.children.splice(node.children.indexOf(child), 1)
      if (child instanceof Node) child.parent = null
    }),
    isInteractive: vi.fn((object: object) => object instanceof Node),
    defaultAttach: vi.fn((object: object) => (object instanceof Shape ? 'shape' : undefined)),
    applyProp: vi.fn((object: object, key: string, value: unknown) => {
      if (!(object instanceof Panel)) return false
      if (key === 'title') {
        if (value === undefined) object.titles.length = 0
        else object.titles.push(value as string)
        return true
      }
      const badge = BADGE.exec(key)
      if (!badge) return false
      object.badges[Number(badge[1])] = value as object | undefined
      return true
    }),
    hitTest: vi.fn((object: object): Hit[] => [{ object }]),
    compareHits: vi.fn((a: Hit, b: Hit) => (b.object as Node).depth - (a.object as Node).depth),
    dispose: vi.fn(),
  } satisfies BaseRendererSupport
}

//* Test Helpers ==============================

const h = React.createElement

function pointerDown() {
  const event = new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 1 })
  for (const key of ['clientX', 'clientY', 'offsetX', 'offsetY']) Object.defineProperty(event, key, { value: 50 })
  return event
}

describe('a renderer support that is not three', () => {
  let root: ReconcilerRoot<HTMLCanvasElement>
  let canvas: HTMLCanvasElement
  let support: ReturnType<typeof createSupport>
  /** The objects of the elements a test names, kept after their refs detach */
  let objects: Record<string, any>
  const keep = (name: string) => (object: object | null) => void (object && (objects[name] = object))

  async function render(element: React.ReactNode): Promise<RootStore> {
    return act(async () => root.render(element))
  }

  beforeEach(async () => {
    support = createSupport()
    objects = {}
    canvas = createCanvas()
    root = createRoot(canvas, { webgpu: () => support })
    await act(async () =>
      root.configure({
        size: { width: 100, height: 100, top: 0, left: 0 },
        dpr: 1,
        frameloop: 'never',
        events: createPointerEvents,
      }),
    )
  })

  afterEach(async () => {
    await act(async () => root.unmount())
  })

  it('builds the root from its classes and adds the default camera through add', async () => {
    const store = await render(null)
    const { scene, camera, internal } = store.getState()

    expect(internal.support).toBe(support)
    expect(scene).toBeInstanceOf(Scene)
    expect(support.add).toHaveBeenCalledWith(scene, camera)
  })

  it('adds, inserts, moves and removes nodes through add and remove, and disposes what it removes', async () => {
    const list = (names: string[]) => names.map((name) => h('node', { key: name, ref: keep(name) }))
    const nodes = (scene: Node) => scene.children.filter((child) => child instanceof Node)

    const store = await render(list(['a', 'b']))
    const scene = store.getState().scene as unknown as Node
    const { a, b } = objects
    expect(nodes(scene)).toEqual([a, b])

    await render(list(['a', 'c', 'b']))
    expect(support.add).toHaveBeenCalledWith(scene, objects.c, b)
    expect(nodes(scene)).toEqual([a, objects.c, b])

    await render(list(['b', 'a', 'c']))
    expect(nodes(scene)).toEqual([b, a, objects.c])

    await render(list(['b', 'c']))
    expect(support.remove).toHaveBeenCalledWith(scene, a)
    expect(support.dispose).toHaveBeenCalledWith(a)
    expect(nodes(scene)).toEqual([b, objects.c])
  })

  it('asks isInteractive which objects are nodes, and attaches the rest where defaultAttach says', async () => {
    await render(h('node', { ref: keep('node') }, h('shape', { ref: keep('shape') })))
    const { node, shape } = objects

    expect(support.isInteractive).toHaveBeenCalledWith(shape)
    expect(support.defaultAttach).toHaveBeenCalledWith(shape)
    expect(node.shape).toBe(shape)
    expect(node.children).not.toContain(shape)

    await render(h('node', { ref: keep('node') }))
    expect(node.shape).toBeNull()
    expect(support.dispose).toHaveBeenCalledWith(shape)
  })

  it('writes the props and attaches the renderer takes through applyProp, and core writes the rest', async () => {
    await render(
      h(
        'panel',
        { ref: keep('panel'), title: 'hello', depth: 3 },
        h('node', { attach: 'badge-1', ref: keep('badge') }),
      ),
    )
    const { panel, badge } = objects

    expect(support.applyProp).toHaveBeenCalledWith(panel, 'title', 'hello')
    expect(panel.titles).toEqual(['hello'])
    expect(panel).not.toHaveProperty('title')
    expect(panel.depth).toBe(3)
    expect(support.applyProp).toHaveBeenCalledWith(panel, 'badge-1', badge)
    expect(panel.badges[1]).toBe(badge)
    expect(panel).not.toHaveProperty('badge')

    // A removed prop reaches the hook as undefined; a detach comes with the value the attach replaced
    await render(h('panel', { ref: keep('panel'), depth: 3 }))
    expect(support.applyProp).toHaveBeenCalledWith(panel, 'title', undefined)
    expect(panel.titles).toEqual([])
    expect(support.applyProp).toHaveBeenCalledWith(panel, 'badge-1', undefined)
    expect(panel.badges[1]).toBeUndefined()
  })

  it('hit tests each node with handlers through hitTest, and orders the hits with compareHits', async () => {
    const order: string[] = []
    const store = await render([
      h('node', { key: 'back', depth: 1, onPointerDown: () => order.push('back') }),
      h('node', { key: 'front', depth: 2, onPointerDown: () => order.push('front') }),
      h('node', { key: 'idle', depth: 3 }),
    ])

    const event = pointerDown()
    await act(async () => canvas.dispatchEvent(event))

    expect(support.hitTest).toHaveBeenCalledTimes(2)
    expect(support.hitTest).toHaveBeenCalledWith(expect.any(Node), event, store.getState())
    expect(support.compareHits).toHaveBeenCalled()
    expect(order).toEqual(['front', 'back'])
  })

  it('hides a node that suspends again through visible, as isInteractive says it is one', async () => {
    const pending = new Promise<never>(() => {})
    const Suspend = () => React.use(pending)
    const tree = (suspend: boolean) =>
      h(React.Suspense, { fallback: null }, h('node', { ref: keep('node') }), suspend && h(Suspend))

    await render(tree(false))
    const { node } = objects
    expect(node.visible).toBe(true)

    await render(tree(true))
    expect(node.visible).toBe(false)
    expect(node.parent).not.toBeNull()
  })
})
