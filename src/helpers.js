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
  return world.parts[reference] || mindstorm
}