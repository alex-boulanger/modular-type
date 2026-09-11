import { GLYPH_GROUPS } from '../../../modules/typeface'
import type { GlyphChar } from '../../../modules/typeface'

export function GlyphSelector({ selected, onSelect }: { selected: GlyphChar; onSelect: (char: GlyphChar) => void }) {
  const group = GLYPH_GROUPS.find(group => group.characters.some(char => char === selected)) ?? GLYPH_GROUPS[0]
  return (
    <div className="character-picker">
      <div className="character-groups" role="group" aria-label="Character set">
        {GLYPH_GROUPS.map(item => <button key={item.label} type="button" aria-label={item.label}
          aria-pressed={item === group} onClick={() => onSelect(item.characters[0])}>{item.shortLabel}</button>)}
      </div>
      <div className="glyph-selector" role="group" aria-label={`${group.label} characters`}>
        {group.characters.map(char => <button key={char} type="button" aria-pressed={selected === char}
          onClick={() => onSelect(char)}>{char}</button>)}
      </div>
    </div>
  )
}
