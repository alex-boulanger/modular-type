import { BASELINE_ROW, GRID_COLUMNS, GRID_ROWS, X_HEIGHT_ROW } from '../../../modules/typeface'
import type { GlyphOutline } from '../../../modules/typeface'
import { useNodeGesture } from './use-node-gesture'

interface GlyphPreviewProps {
  glyph: GlyphOutline
  unitsPerEm: number
  inspect: boolean
  onTogglePoint: (pointId: number) => void
  onConnectPoints: (from: number, to: number) => void
  onDisconnectPoints: (from: number, to: number) => void
}

export function GlyphPreview({ glyph, unitsPerEm, inspect, onTogglePoint, onConnectPoints, onDisconnectPoints }: GlyphPreviewProps) {
  const scale = unitsPerEm / 1000
  const grid = glyph.construction.grid
  // Anchor the canvas to the logical grid, not the ink bounds: removing an
  // outside module must never move the next click target under the pointer.
  const gridCenter = (grid[0].position[0] + grid[GRID_COLUMNS - 1].position[0]) / 2
  const offset = 400 * scale - gridCenter
  const {
    drawingRef, preview, onPointerMove, onPointerUp, onPointerCancel,
    onLostPointerCapture, onKeyDown, onPointPointerDown, onPointFocus, onPointKeyDown,
  } = useNodeGesture(grid, scale, onTogglePoint, onConnectPoints)

  return (
    <svg viewBox={`${-80 * scale} ${-40 * scale} ${960 * scale} ${1120 * scale}`} role="group" aria-label={`Edit glyph ${glyph.char}`}
      onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel} onLostPointerCapture={onLostPointerCapture} onKeyDown={onKeyDown}>
      <g ref={drawingRef} transform={`translate(${offset} ${800 * scale}) scale(1 -1)`}>
        {inspect && <g className="construction-grid" aria-hidden="true">
          {Array.from({ length: GRID_ROWS }, (_, row) => {
            const start = grid[row * GRID_COLUMNS].position
            return <line className={row === BASELINE_ROW ? 'baseline' : row === X_HEIGHT_ROW ? 'x-height' : undefined} key={`row-${row}`} x1={-800 * scale} y1={start[1]} x2={1600 * scale} y2={start[1]} />
          })}
          {Array.from({ length: GRID_COLUMNS }, (_, column) => {
            const start = grid[column].position
            return <line key={`column-${column}`} x1={start[0]} y1={-800 * scale} x2={start[0]} y2={1600 * scale} />
          })}
        </g>}
        <path d={glyph.pathData} fill="currentColor" fillRule="nonzero" className="glyph-outline" />
        {inspect && <g className="connection-targets">
          {glyph.construction.connections.map(({ from, to, start, end }) => <line key={`${from}-${to}`}
            className="connection-hit" x1={start[0]} y1={start[1]} x2={end[0]} y2={end[1]}
            role="button" tabIndex={0} aria-label={`Remove connection ${glyph.char} ${from + 1}–${to + 1}`}
            onClick={() => onDisconnectPoints(from, to)}
            onKeyDown={event => {
              if (['Enter', ' ', 'Delete', 'Backspace'].includes(event.key)) {
                event.preventDefault()
                if (!event.repeat) onDisconnectPoints(from, to)
              }
            }}><title>Click to remove this connection</title></line>)}
        </g>}
        {inspect && preview && <line className={`connection-preview${preview.target !== null ? ' has-target' : ''}`}
          x1={grid[preview.source].position[0]} y1={grid[preview.source].position[1]}
          x2={preview.end[0]} y2={preview.end[1]} aria-hidden="true" />}
        {inspect && <g className="grid-points">
          {grid.map(({ id, position: [x, y], active }) => (
            <g key={id} role="button" tabIndex={0} aria-pressed={active}
              aria-label={`Node ${glyph.char}, column ${id % GRID_COLUMNS + 1}, row ${Math.floor(id / GRID_COLUMNS) + 1}`}
              className={`grid-point${active ? ' is-active' : ''}${preview?.source === id ? ' is-source' : ''}${preview?.target === id ? ' is-target' : ''}`}
              transform={`translate(${x} ${y})`}
              onPointerDown={event => onPointPointerDown(event, id)}
              onClick={event => { if (event.detail === 0) onTogglePoint(id) }}
              onFocus={() => onPointFocus(id)} onKeyDown={event => onPointKeyDown(event, id)}>
              <title>Click to {active ? 'disable' : 'enable'}. Drag to another node to connect, or press Shift+Enter on each node.</title>
              <circle className="point-hit" r={22 * scale} />
              <circle className="point-marker" r={(active ? 5 : 3.5) * scale} />
            </g>
          ))}
        </g>}
      </g>
    </svg>
  )
}
