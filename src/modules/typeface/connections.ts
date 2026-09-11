import type { Polygon, Ring } from 'polygon-clipping'
import type { Point } from './types'

/**
 * Connect equal ellipses with two concave cubic curves tangent to their edges.
 * Work in normalized circle space, then apply the same ellipse transform as
 * the modules. The neck is bounded so even light styles remain connected.
 */
export function organicConnection(a: Point, b: Point, rx: number, ry: number, fullness: number, softness: number): Polygon {
  const dx = (b[0] - a[0]) / rx
  const dy = (b[1] - a[1]) / ry
  const distance = Math.hypot(dx, dy)
  const angle = Math.atan2(dy, dx)
  const overlap = Math.acos(Math.min(1, distance / 2))
  const attachment = overlap + (Math.PI / 2 - overlap) * fullness
  const x = Math.cos(attachment)
  const y = Math.sin(attachment)
  const gap = distance - 2 * x
  const minimumNeck = fullness > 0.5 ? 0.42 : 0.16
  const handle = Math.min(gap * 0.52, (y - minimumNeck) * 4 / (3 * Math.max(x, 0.001))) * (0.15 + softness * 0.85)
  const ring: Ring = []
  const append = (px: number, py: number) => ring.push([
    a[0] + (px * Math.cos(angle) - py * Math.sin(angle)) * rx,
    a[1] + (px * Math.sin(angle) + py * Math.cos(angle)) * ry,
  ])
  const cubic = (start: Point, c1: Point, c2: Point, end: Point) => {
    for (let i = 0; i <= 20; i++) {
      const t = i / 20
      const u = 1 - t
      append(
        u ** 3 * start[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t ** 3 * end[0],
        u ** 3 * start[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t ** 3 * end[1],
      )
    }
  }
  cubic([x, y], [x + handle * y, y - handle * x],
    [distance - x - handle * y, y - handle * x], [distance - x, y])
  cubic([distance - x, -y], [distance - x - handle * y, -y + handle * x],
    [x + handle * y, -y + handle * x], [x, -y])
  return [ring]
}
