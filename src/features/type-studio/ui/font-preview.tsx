import { useEffect, useRef, useState } from 'react'
import type { Typeface } from '../../../modules/typeface'
import { useFontPreview } from '../model/use-font-preview'

const SAMPLE_TEXT = 'Modular Type\nSphinx of black quartz, judge my vow!\n0123456789 - ?'

interface FontPreviewProps {
  typeface: Typeface
  open: boolean
  onClose: () => void
}

/** Free text set in the exported font. The dialog stays mounted so text and size survive reopening. */
export function FontPreview({ typeface, open, onClose }: FontPreviewProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const [text, setText] = useState(SAMPLE_TEXT)
  const [size, setSize] = useState(96)
  const font = useFontPreview(typeface, open)

  // The native modal dialog traps focus, handles Escape and draws the backdrop.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      textRef.current?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={dialogRef} className="font-preview" aria-labelledby="font-preview-title" onClose={onClose}
      onClick={event => { if (event.target === event.currentTarget) onClose() }}>
      <div className="font-preview-body">
        <header className="font-preview-header">
          <h2 id="font-preview-title">Preview</h2>
          <label className="font-preview-size">
            Size
            <input type="range" min="24" max="200" step="1" value={size} onChange={event => setSize(Number(event.target.value))} />
            <output>{size}</output>
          </label>
          <button type="button" onClick={onClose} aria-label="Close preview">×</button>
        </header>
        {font.status === 'loading' && <p className="font-preview-status" role="status">Preparing the font…</p>}
        {font.status === 'error' && <p className="notice" role="alert">Could not prepare the preview: {font.message}</p>}
        <textarea ref={textRef} aria-label="Preview text" value={text} spellCheck={false}
          onChange={event => setText(event.target.value)}
          style={{ fontSize: size, fontFamily: font.status === 'ready' ? `"${font.family}", sans-serif` : undefined }} />
      </div>
    </dialog>
  )
}
