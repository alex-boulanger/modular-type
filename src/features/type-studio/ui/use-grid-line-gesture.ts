import { useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, RefObject } from 'react'
import { GRID_COLUMNS, GRID_ROWS } from '../../../modules/typeface'
import type { GlyphOutline, GridAxis } from '../../../modules/typeface'

/** Grid line editing from the canvas. Positions are in grid units. */
export interface GridLineEditor {
  preview: (axis: GridAxis, line: number, position: number) => GlyphOutline | null
  move: (axis: GridAxis, line: number, position: number, continuous: boolean) => void
  reset: (axis: GridAxis, line: number) => void
  endAdjust: () => void
}

interface LineDrag {
  pointerId: number
  element: SVGGElement
  /** Pointer offset from the line when grabbed, so the line never jumps to the cursor. */
  grab: number
  position: number
}

const NUDGE: Record<GridAxis, Record<string, number>> = {
  column: { ArrowLeft: -1, ArrowRight: 1 },
  row: { ArrowUp: -1, ArrowDown: 1 },
}
const STEP = 0.05
const LARGE_STEP = 0.25

/**
 * Drags preview the letter locally and commit once on release, like node
 * gestures: a cancelled drag never touches the project or its history.
 */
export function useGridLineGesture(committed: GlyphOutline, drawingRef: RefObject<SVGGElement | null>, editor: GridLineEditor) {
  const drag = useRef<LineDrag | null>(null)
  const [active, setActive] = useState<{ axis: GridAxis; line: number; glyph: GlyphOutline | null } | null>(null)
  const glyph = active?.glyph ?? committed
  const { lines } = glyph.construction

  // Grid units count regular gaps from the first line. The frame never moves,
  // so the rendered outline, preview or not, converts pointer positions.
  const toUnits = (axis: GridAxis, value: number) => axis === 'column'
    ? (value - lines.columns[0]) / (lines.columns[GRID_COLUMNS - 1] - lines.columns[0]) * (GRID_COLUMNS - 1)
    : (lines.rows[0] - value) / (lines.rows[0] - lines.rows[GRID_ROWS - 1]) * (GRID_ROWS - 1)
  const positionOf = (axis: GridAxis, line: number) => toUnits(axis, (axis === 'column' ? lines.columns : lines.rows)[line])
  const pointerAt = (event: PointerEvent, axis: GridAxis) => {
    const matrix = drawingRef.current?.getScreenCTM()
    if (!matrix) return null
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    return toUnits(axis, axis === 'column' ? point.x : point.y)
  }

  const cancel = () => {
    const current = drag.current
    drag.current = null
    setActive(null)
    if (current?.element.hasPointerCapture(current.pointerId)) current.element.releasePointerCapture(current.pointerId)
  }

  const handleProps = (axis: GridAxis, line: number) => ({
    onPointerDown: (event: PointerEvent<SVGGElement>) => {
      if (!event.isPrimary || event.button !== 0 || drag.current) return
      const pointer = pointerAt(event, axis)
      if (pointer === null) return
      event.preventDefault()
      event.currentTarget.focus()
      event.currentTarget.setPointerCapture(event.pointerId)
      const position = positionOf(axis, line)
      drag.current = { pointerId: event.pointerId, element: event.currentTarget, grab: pointer - position, position }
      setActive({ axis, line, glyph: null })
    },
    onPointerMove: (event: PointerEvent<SVGGElement>) => {
      const current = drag.current
      if (!current || current.pointerId !== event.pointerId) return
      const pointer = pointerAt(event, axis)
      if (pointer === null) return
      current.position = pointer - current.grab
      const outline = editor.preview(axis, line, current.position)
      if (outline) setActive({ axis, line, glyph: outline })
    },
    onPointerUp: (event: PointerEvent<SVGGElement>) => {
      const current = drag.current
      if (!current || current.pointerId !== event.pointerId) return
      cancel()
      editor.move(axis, line, current.position, false)
    },
    onPointerCancel: (event: PointerEvent<SVGGElement>) => {
      if (drag.current?.pointerId === event.pointerId) cancel()
    },
    onLostPointerCapture: (event: PointerEvent<SVGGElement>) => {
      if (drag.current?.pointerId === event.pointerId) cancel()
    },
    onDoubleClick: () => editor.reset(axis, line),
    onKeyDown: (event: KeyboardEvent<SVGGElement>) => {
      if (event.key === 'Escape') {
        if (drag.current) { event.preventDefault(); cancel() }
        return
      }
      if (drag.current) return
      const direction = NUDGE[axis][event.key]
      if (direction) {
        event.preventDefault()
        editor.move(axis, line, positionOf(axis, line) + direction * (event.shiftKey ? LARGE_STEP : STEP), true)
      } else if ((event.key === 'Delete' || event.key === 'Backspace') && !event.repeat) {
        event.preventDefault()
        editor.reset(axis, line)
      }
    },
    onKeyUp: (event: KeyboardEvent<SVGGElement>) => {
      if (NUDGE[axis][event.key]) editor.endAdjust()
    },
  })

  return { glyph, active, positionOf, handleProps }
}
