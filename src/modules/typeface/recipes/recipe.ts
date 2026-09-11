import type { Point } from '../types'

export interface Recipe {
  nodes: Point[]
  connections: (readonly [number, number])[]
}

// Each point is an intentional visible module. Do not add a bead at every
// grid intersection: the rhythm and negative space belong to the recipe.
export function recipe(...strokes: Point[][]): Recipe {
  const nodes: Point[] = []
  const connections: [number, number][] = []
  const indices = new Map<string, number>()
  const edges = new Set<string>()
  const node = (point: Point) => {
    const key = point.join(',')
    const existing = indices.get(key)
    if (existing !== undefined) return existing
    indices.set(key, nodes.length)
    return nodes.push(point) - 1
  }
  for (const stroke of strokes) {
    for (const point of stroke) node(point)
    for (let i = 1; i < stroke.length; i++) {
      const from = node(stroke[i - 1])
      const to = node(stroke[i])
      const key = [from, to].sort((a, b) => a - b).join(':')
      if (!edges.has(key)) {
        edges.add(key)
        connections.push([from, to])
      }
    }
  }
  return { nodes, connections }
}


export const variants = (base: Recipe, alternate = base): readonly [Recipe, Recipe] => [base, alternate]
