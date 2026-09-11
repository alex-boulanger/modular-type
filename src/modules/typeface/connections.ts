import type { Polygon, Ring } from 'polygon-clipping'
import type { Point } from './types'

type Emit = (x: number, y: number) => void

function sampleCubic(start: Point, c1: Point, c2: Point, end: Point, emit: Emit) {
  for (let i = 0; i <= 20; i++) {
    const t = i / 20
    const u = 1 - t
    emit(
      u ** 3 * start[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t ** 3 * end[0],
      u ** 3 * start[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t ** 3 * end[1],
    )
  }
}

/** Longest handle that keeps the neck open and the two curves from crossing. */
function handleLength(x: number, y: number, gap: number, minimumNeck: number, softness: number): number {
  return Math.min(gap * 0.52, (y - minimumNeck) * 4 / (3 * Math.max(x, 0.001))) * (0.15 + softness * 0.85)
}

/** Equal ellipses share one normalized circle space, where the construction is exact. */
function equalConnection(a: Point, b: Point, rx: number, ry: number, fullness: number, softness: number): Polygon {
  const dx = (b[0] - a[0]) / rx
  const dy = (b[1] - a[1]) / ry
  const distance = Math.hypot(dx, dy)
  const angle = Math.atan2(dy, dx)
  const overlap = Math.acos(Math.min(1, distance / 2))
  const attachment = overlap + (Math.PI / 2 - overlap) * fullness
  const x = Math.cos(attachment)
  const y = Math.sin(attachment)
  const handle = handleLength(x, y, distance - 2 * x, fullness > 0.5 ? 0.42 : 0.16, softness)
  const ring: Ring = []
  const append: Emit = (px, py) => ring.push([
    a[0] + (px * Math.cos(angle) - py * Math.sin(angle)) * rx,
    a[1] + (px * Math.sin(angle) + py * Math.cos(angle)) * ry,
  ])
  sampleCubic([x, y], [x + handle * y, y - handle * x],
    [distance - x - handle * y, y - handle * x], [distance - x, y], append)
  sampleCubic([distance - x, -y], [distance - x - handle * y, -y + handle * x],
    [x + handle * y, -y + handle * x], [x, -y], append)
  return [ring]
}

/** The neighbour seen from one module, in that module's unit-circle space. */
function neighbour(center: Point, [rx, ry]: Point, other: Point, [otherRx, otherRy]: Point) {
  const dx = (other[0] - center[0]) / rx
  const dy = (other[1] - center[1]) / ry
  return { distance: Math.hypot(dx, dy), angle: Math.atan2(dy, dx), radius: Math.sqrt(otherRx / rx * (otherRy / ry)) }
}

/**
 * Ellipses of different sizes have no shared circle space. Each curve leaves
 * both modules along their own tangents, so the bridge stays smooth where it
 * meets them; overlap and handles are measured from each module's viewpoint,
 * treating its neighbour as a circle of the same area. Between modules of very
 * different proportions a side can fold slightly; outline cleanup drops the specks.
 */
function unequalConnection(a: Point, radiiA: Point, b: Point, radiiB: Point, fullness: number, softness: number): Polygon | null {
  const fromA = neighbour(a, radiiA, b, radiiB)
  const fromB = neighbour(b, radiiB, a, radiiA)
  // Cosine of the angle where the two outlines cross, seen from one module.
  const crossing = ({ distance, radius }: typeof fromA) => (distance ** 2 + 1 - radius ** 2) / (2 * distance)
  // A module covered past its centre only peeks out of its neighbour: the
  // union alone reads as one mass, and a bridge there would fold on itself.
  if (Math.min(fromA.distance, fromB.distance) < 1e-9 || crossing(fromA) <= 0 || crossing(fromB) <= 0) return null
  const attach = (view: typeof fromA) => {
    const overlap = Math.acos(Math.min(1, crossing(view)))
    return overlap + (Math.PI / 2 - overlap) * fullness
  }
  const attachA = attach(fromA)
  const attachB = attach(fromB)
  const minimumNeck = fullness > 0.5 ? 0.42 : 0.16
  const handle = (own: number, other: number, { distance, radius }: typeof fromA) => {
    const x = Math.cos(own)
    const gap = Math.max(0, distance - x - radius * Math.cos(other))
    return Math.max(0, handleLength(x, Math.sin(own), gap, minimumNeck, softness))
  }
  const handleA = handle(attachA, attachB, fromA)
  const handleB = handle(attachB, attachA, fromB)
  const point = (center: Point, [rx, ry]: Point, t: number): Point => [center[0] + rx * Math.cos(t), center[1] + ry * Math.sin(t)]
  // Along the counter-clockwise tangent, scaled like the module so handles use its units.
  const control = (from: Point, [rx, ry]: Point, t: number, length: number): Point =>
    [from[0] - rx * Math.sin(t) * length, from[1] + ry * Math.cos(t) * length]
  const ring: Ring = []
  const emit: Emit = (x, y) => ring.push([x, y])
  const upperA = fromA.angle + attachA
  const upperB = fromB.angle - attachB
  const lowerB = fromB.angle + attachB
  const lowerA = fromA.angle - attachA
  const upperStart = point(a, radiiA, upperA)
  const upperEnd = point(b, radiiB, upperB)
  sampleCubic(upperStart, control(upperStart, radiiA, upperA, -handleA), control(upperEnd, radiiB, upperB, handleB), upperEnd, emit)
  const lowerStart = point(b, radiiB, lowerB)
  const lowerEnd = point(a, radiiA, lowerA)
  sampleCubic(lowerStart, control(lowerStart, radiiB, lowerB, -handleB), control(lowerEnd, radiiA, lowerA, handleA), lowerEnd, emit)
  return [ring]
}

/**
 * Connect two elliptical modules with two concave cubic curves tangent to
 * their edges. The neck is bounded so even light styles remain connected.
 * Returns null when one module swallows the other.
 */
export function organicConnection(a: Point, radiiA: Point, b: Point, radiiB: Point, fullness: number, softness: number): Polygon | null {
  if (radiiA[0] === radiiB[0] && radiiA[1] === radiiB[1]) return equalConnection(a, b, radiiA[0], radiiA[1], fullness, softness)
  return unequalConnection(a, radiiA, b, radiiB, fullness, softness)
}
