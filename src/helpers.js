import { Vector } from 'matter-js'

export function worldToObjectPoint(worldPoint, object) {
  const translated = Vector.sub(worldPoint, object)
  return Vector.rotate(translated, -object.angle/180*Math.PI)
}

export function objectToWorldPoint(objectPoint, object) {
  const rotated = Vector.rotate(objectPoint, object.angle/180*Math.PI)
  return Vector.add(rotated, object)
}

export function resolveReference(reference, world) {
  //  TODO: better reference resolution
  return world.parts[reference] || world
}

export function distance(a, b) {
  const x = a.x-b.x
  const y = a.y-b.y
  return Math.sqrt(x*x + y*y)
}
