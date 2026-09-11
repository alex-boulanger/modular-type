import type { GlyphChar } from './types'
import type { Recipe } from './recipes/recipe'
import { recipe, variants } from './recipes/recipe'
import { UPPERCASE } from './recipes/uppercase'
import { LOWERCASE } from './recipes/lowercase'
import { NUMBERS } from './recipes/numbers'

export const RECIPES: Record<GlyphChar, readonly [Recipe, Recipe]> = {
  ...UPPERCASE, ...LOWERCASE, ...NUMBERS,
  '.': variants(recipe([[2, 6]])),
  ',': variants(recipe([[2, 6], [1, 8]])),
  '!': variants(recipe([[2, 0], [2, 3]], [[2, 6]])),
  '?': variants(recipe([[0, 1], [2, 0], [4, 1], [4, 2], [2, 3], [2, 4]], [[2, 6]])),
  '-': variants(recipe([[1, 3], [3, 3]])),
}
