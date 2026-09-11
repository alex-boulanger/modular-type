import { recipe, variants } from './recipe'

// Rows 0/2/6/8 mark ascenders, x-height, baseline, and descenders.
// These are independently authored lowercase drawings, not scaled capitals.
export const LOWERCASE = {
  a: variants(recipe([[4, 3], [2, 2], [0, 3], [0, 5], [2, 6], [4, 5], [4, 2], [4, 6]])),
  b: variants(recipe([[0, 0], [0, 3], [0, 6]], [[0, 3], [2, 2], [4, 3], [4, 5], [2, 6], [0, 5]])),
  c: variants(recipe([[4, 3], [2, 2], [0, 3], [0, 5], [2, 6], [4, 5]])),
  d: variants(recipe([[4, 0], [4, 3], [4, 6]], [[4, 3], [2, 2], [0, 3], [0, 5], [2, 6], [4, 5]])),
  e: variants(recipe([[0, 4], [2, 4], [4, 4], [4, 3], [2, 2], [0, 3], [0, 5], [2, 6], [4, 6]])),
  f: variants(recipe([[4, 0], [2, 0], [1, 1], [1, 3], [1, 6]], [[0, 3], [3, 3]])),
  g: variants(recipe([[4, 3], [2, 2], [0, 3], [0, 5], [2, 6], [4, 5]], [[4, 2], [4, 5], [4, 7], [2, 8], [0, 7]])),
  h: variants(recipe([[0, 0], [0, 3], [0, 6]], [[0, 3], [2, 2], [4, 3], [4, 6]])),
  i: variants(recipe([[2, 0]], [[2, 2], [2, 4], [2, 6]])),
  j: variants(recipe([[3, 0]], [[3, 2], [3, 5], [3, 7], [1, 8], [0, 7]])),
  k: variants(recipe([[0, 0], [0, 4], [0, 6]], [[4, 2], [0, 4], [4, 6]])),
  l: variants(recipe([[1, 0], [1, 3], [1, 5], [2, 6], [3, 6]])),
  m: variants(recipe([[0, 6], [0, 2], [2, 3], [2, 6]], [[2, 3], [4, 2], [4, 6]])),
  n: variants(recipe([[0, 6], [0, 2]], [[0, 3], [2, 2], [4, 3], [4, 6]])),
  o: variants(recipe([[2, 2], [0, 3], [0, 5], [2, 6], [4, 5], [4, 3], [2, 2]])),
  p: variants(recipe([[0, 8], [0, 5], [0, 2]], [[0, 3], [2, 2], [4, 3], [4, 5], [2, 6], [0, 5]])),
  q: variants(recipe([[4, 8], [4, 5], [4, 2]], [[4, 3], [2, 2], [0, 3], [0, 5], [2, 6], [4, 5]])),
  r: variants(recipe([[0, 6], [0, 2]], [[0, 3], [2, 2], [3, 3]])),
  s: variants(recipe([[4, 2], [1, 2], [0, 3], [2, 4], [4, 5], [3, 6], [0, 6]])),
  t: variants(recipe([[1, 0], [1, 3], [1, 5], [2, 6], [4, 5]], [[0, 2], [3, 2]])),
  u: variants(recipe([[0, 2], [0, 5], [2, 6], [4, 5]], [[4, 2], [4, 6]])),
  v: variants(recipe([[0, 2], [2, 6], [4, 2]])),
  w: variants(recipe([[0, 2], [1, 6], [2, 4], [3, 6], [4, 2]])),
  x: variants(recipe([[0, 2], [2, 4], [4, 6]], [[4, 2], [2, 4], [0, 6]])),
  y: variants(recipe([[0, 2], [2, 6]], [[4, 2], [2, 6], [1, 8], [0, 8]])),
  z: variants(recipe([[0, 2], [4, 2], [0, 6], [4, 6]])),
} as const
