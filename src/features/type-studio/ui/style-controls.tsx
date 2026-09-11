import type { ReactNode } from 'react'
import { CONTROLS } from '../../../modules/typeface'
import type { FontStyle } from '../../../modules/typeface'

interface StyleControlsProps {
  style: FontStyle
  onChange: (patch: Partial<FontStyle>) => void
  onCommit: () => void
  /** Extra sections shown between the connection style and the sliders. */
  children?: ReactNode
}

export function StyleControls({ style, onChange, onCommit, children }: StyleControlsProps) {
  return (
    <div className="style-controls" onPointerUp={onCommit} onPointerCancel={onCommit} onKeyUp={onCommit} onBlur={onCommit}>
      <fieldset>
        <legend>Connections</legend>
        <div className="segmented">
          <button type="button" aria-pressed={style.connectionStyle === 'union'} onClick={() => onChange({ connectionStyle: 'union' })}>Union</button>
          <button type="button" aria-pressed={style.connectionStyle === 'bridge'} onClick={() => onChange({ connectionStyle: 'bridge' })}>Bridge</button>
        </div>
      </fieldset>
      {children}
      <div className="sliders">
        {CONTROLS.map(control => (
          <div className="slider-control" key={control.key}>
            <div className="slider-heading">
              <label htmlFor={`style-${control.key}`} title={control.description}>{control.label}</label>
              <output htmlFor={`style-${control.key}`}>{Math.round(style[control.key] * 100)}</output>
            </div>
            <input id={`style-${control.key}`} type="range" min="0" max="100" step="1"
              value={Math.round(style[control.key] * 100)} aria-describedby={`help-${control.key}`}
              onChange={event => onChange({ [control.key]: Number(event.target.value) / 100 })} />
            <p id={`help-${control.key}`} className="sr-only">{control.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
