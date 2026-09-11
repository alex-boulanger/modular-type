import { useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import type { GridNode } from '../../../modules/typeface'

type Position = GridNode['position']
interface Drag {
  pointerId: number
  source: number
  start: Position
  moved: boolean
  capture: SVGSVGElement
}
interface Preview {
  source: number
  target: number | null
  end: Position
}

export function useNodeGesture(grid: GridNode[], scale: number, onToggle: (id: number) => void, onConnect: (from: number, to: number) => void) {
  const drawingRef = useRef<SVGGElement>(null)
  const drag = useRef<Drag | null>(null)
  const keyboardSource = useRef<number | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)

  const locate = (event: PointerEvent<SVGSVGElement>) => {
    const matrix = drawingRef.current?.getScreenCTM()
    if (!matrix) return null
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    const node = grid.find(({ position: [x, y] }) => Math.hypot(x - point.x, y - point.y) <= 22 * scale)
    return { point: [point.x, point.y] as Position, node }
  }

  const cancel = () => {
    const active = drag.current
    drag.current = null
    keyboardSource.current = null
    setPreview(null)
    if (active?.capture.hasPointerCapture(active.pointerId)) active.capture.releasePointerCapture(active.pointerId)
  }

  const onPointPointerDown = (event: PointerEvent<SVGGElement>, source: number) => {
    if (!event.isPrimary || event.button !== 0 || drag.current) return
    event.preventDefault()
    const capture = event.currentTarget.ownerSVGElement
    if (!capture) return
    keyboardSource.current = null
    setPreview(null)
    event.currentTarget.focus()
    capture.setPointerCapture(event.pointerId)
    drag.current = { pointerId: event.pointerId, source, start: [event.clientX, event.clientY], moved: false, capture }
  }

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const active = drag.current
    if (!active || active.pointerId !== event.pointerId) return
    active.moved ||= Math.hypot(event.clientX - active.start[0], event.clientY - active.start[1]) >= 6
    if (!active.moved) return
    const location = locate(event)
    if (location) setPreview({ source: active.source, target: location.node?.id ?? null, end: location.node?.position ?? location.point })
  }

  const onPointerUp = (event: PointerEvent<SVGSVGElement>) => {
    const active = drag.current
    if (!active || active.pointerId !== event.pointerId) return
    const moved = active.moved || Math.hypot(event.clientX - active.start[0], event.clientY - active.start[1]) >= 6
    const location = locate(event)
    cancel()
    if (moved) {
      if (location?.node && location.node.id !== active.source) onConnect(active.source, location.node.id)
    } else if (location?.node?.id === active.source) {
      onToggle(active.source)
    }
  }

  const onPointKeyDown = (event: KeyboardEvent<SVGGElement>, id: number) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    if (event.repeat || drag.current) return
    if (event.shiftKey && event.key === 'Enter') {
      if (keyboardSource.current === null) {
        keyboardSource.current = id
        setPreview({ source: id, target: id, end: grid[id].position })
      } else {
        const source = keyboardSource.current
        cancel()
        if (source !== id) onConnect(source, id)
      }
    } else {
      cancel()
      onToggle(id)
    }
  }

  return {
    drawingRef, preview, onPointPointerDown, onPointerMove, onPointerUp, onPointKeyDown,
    onPointerCancel: (event: PointerEvent<SVGSVGElement>) => {
      if (drag.current?.pointerId === event.pointerId) cancel()
    },
    onLostPointerCapture: (event: PointerEvent<SVGSVGElement>) => {
      if (drag.current?.pointerId === event.pointerId) cancel()
    },
    onKeyDown: (event: KeyboardEvent<SVGSVGElement>) => {
      if (event.key === 'Escape') { event.preventDefault(); cancel() }
    },
    onPointFocus: (id: number) => {
      if (keyboardSource.current !== null) setPreview({ source: keyboardSource.current, target: id, end: grid[id].position })
    },
  }
}
