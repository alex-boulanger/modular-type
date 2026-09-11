interface GridControlsProps {
  canReset: boolean
  onRandomize: () => void
  onReset: () => void
}

export function GridControls({ canReset, onRandomize, onReset }: GridControlsProps) {
  return (
    <fieldset>
      <legend>Grid</legend>
      <div className="grid-actions">
        <button type="button" onClick={onRandomize}>Randomize</button>
        <button type="button" disabled={!canReset} onClick={onReset}>Reset grid</button>
      </div>
    </fieldset>
  )
}
