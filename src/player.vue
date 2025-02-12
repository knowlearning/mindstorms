<script setup>
  import * as Matter from 'matter-js'
  import World from './world.vue'
  import { ref, reactive, watch } from 'vue'
  import { useAnimationLoop } from './composables/animation.js'
  import { useKeyboardEvents } from './composables/keyboard.js'
  import { worldToObjectPoint, objectToWorldPoint, resolveReference, distance } from './helpers.js'
  import BoundingRectangle from './bounding-rectangle.vue'
  import Constraint from './constraint.vue'

  const nameToConstraint = {}

  const canvas = ref(null)

  const engine = Matter.Engine.create()

  const runner = Matter.Runner.create()
  Matter.Runner.run(runner, engine)

  const { registerKey } = useKeyboardEvents()
  const { registerAnimationCallback }  = useAnimationLoop()

  const props = defineProps({ uuid: String })

  registerKey('Escape', () => Agent.close())

  const mindstorm = JSON.parse(JSON.stringify(await Agent.state(props.uuid)))
  const world = reactive(await Agent.state(`run-state/${props.uuid}`))

  const initialized = new Set()

  registerAnimationCallback(() => {
    Object
      .entries(world.parts)
      .forEach(([name, object]) => {
        const { initialize, step } = object
        if (!initialized.has(`objects/${name}`)) {
          initialized.add(`objects/${name}`)
          if (initialize) handleEvent(name, 'initialize', {})
        }
        if (step) handleEvent(name, 'step', {})
      })
    updateConnections()
    updateParts()
  })

  Object.keys(world).forEach(key => delete world[key])
  Object.assign(world, mindstorm)

  const matterIdToWorldObject = new Map()
  const referenceToBody = new Map()

  let lastConnections = new Set()

  function updateConnections() {
    const presentConnections = new Set(Object.keys(world.connections))

    presentConnections
      .difference(lastConnections)
      .forEach(insertConnection)

    lastConnections
      .difference(presentConnections)
      .forEach(removeConnection)

    lastConnections = presentConnections
  }

  let lastParts = new Set()

  function updateParts() {
    const presentParts = new Set(Object.keys(world.parts))

    presentParts
      .difference(lastParts)
      .forEach(insertPart)

    lastParts
      .difference(presentParts)
      .forEach(removePart)

    lastParts = presentParts
  }

  updateParts()
  updateConnections()

  Matter.Events.on(engine, 'afterUpdate', function() {
    Matter.Composite.allBodies(engine.world).forEach(function(body) {
      const { object:o } = matterIdToWorldObject.get(body.id)
      if (!o) return // this is the case when the body is a part of the object

      const p = body.position

      if (!!o.static !== !!body.isStatic) {
        Matter.Body.setStatic(body, !!o.static)
      }

      if (o.static) {
        Matter.Body.setPosition(body, o)
        Matter.Body.setVelocity(body, {x:0,y:0})
      }
      else if (distance(o, p) > 0.1) {
        o.x = p.x
        o.y = p.y
      }

      const bodyAngleInDegrees = body.angle*180/Math.PI

      if (Math.abs(bodyAngleInDegrees - o.angle) > 1) {
        o.angle = bodyAngleInDegrees
      }
    })
  })

  watch(() => canvas.value, () => {
    //renderCanvas()
  })

  function insertPart(name) {
    const object = world.parts[name]

    const { x, y, width, height, angle, parts={} } = object
    const body = Matter.Bodies.rectangle(x, y, width, height, {
      angle: angle*Math.PI/180,
      friction: 0.5,
      restitution: 0.1,
      density: 0.1
    })

    Object.values(parts).forEach(part => {
      const rotatedPoint = Matter.Vector.rotate({ x: part.x, y: part.y }, angle*Math.PI/180)
      const partBody = Matter.Bodies.rectangle(
        rotatedPoint.x + object.x,
        rotatedPoint.y + object.y,
        part.width,
        part.height,
        {
          angle: (angle + part.angle)*Math.PI/180
        }
      )
    })

    Matter.World.add(engine.world, body)
    matterIdToWorldObject.set(body.id, { object, name })
    referenceToBody.set(name, body)
  }

  function removePart(name) {
    const body = referenceToBody.get(name)
    Matter.World.remove(engine.world, body)
    matterIdToWorldObject.delete(body.id)
    referenceToBody.delete(name)
  }

  function insertConnection(name) {
    const { from, to, stiffness } = world.connections[name]
    const worldPointA = objectToWorldPoint(from, resolveReference(from.reference, world))
    const worldPointB = objectToWorldPoint(to, resolveReference(to.reference, world))
    const constraint = Matter.Constraint.create({
      bodyA: referenceToBody.get(from.reference),
      bodyB: referenceToBody.get(to.reference),
      pointA: from.reference ? { x: from.x, y: from.y } : worldPointA,
      pointB: to.reference ? { x: to.x, y: to.y } : worldPointB,
      length: distance(worldPointA, worldPointB),
      stiffness
    })
    nameToConstraint[name] = constraint
    Matter.World.add(engine.world, constraint)
  }

  function removeConnection(name) {
    Matter.World.remove(engine.world, nameToConstraint[name])
    delete nameToConstraint[name]
  }

  function renderCanvas() {
    const render = Matter.Render.create({
      canvas: canvas.value,
      engine,
      options: {
        wireframes: true,
        width: 100,
        height: 100,
        wireframeBackground: 'rgba(0,0,0,0)',
        wireframeStrokeStyle: 'rgba(0,0,0,0.2)'
      }
    })
    Matter.Render.run(render)
  }

  function handleClick({target: name, event: rawEvent}) {
    const handler = world.parts?.[name]?.click
    if (handler) handleEvent(name, 'click', {})
  }

  function handleDrag({target: name, event }) {
    const { detail: { svg_x:x, svg_y:y, svg_dx:dx, svg_dy:dy } } = event
    const handler = world.parts?.[name]?.drag
    if (handler) handleEvent(name, 'drag', { x, y, dx, dy })
  }

  function handleDragstart({target: name, event }) {
    const { detail: { svg_x:x, svg_y:y, svg_dx:dx, svg_dy:dy } } = event
    const handler = world.parts?.[name]?.dragstart
    if (handler) handleEvent(name, 'dragstart', { x, y, dx, dy })
  }

  function handleDragstop({target: name, event }) {
    const handler = world.parts?.[name]?.dragend
    if (handler) handleEvent(name, 'dragend', event)
  }

  function handleEvent(objectName, eventName, event) {
    const object = world.parts[objectName]
    const handler = object?.[eventName]
    if (handler) {
      try {
        const scopedHandler = new Function('world', 'name', 'event', `with (world, name, event) { ${handler} }`)
        const result = scopedHandler.bind(object)(world, objectName, event)
      } catch (error) {
        console.error('Error', objectName, eventName, error)
      }
    }
  }

  Matter.Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach(pair => {
      const woA = matterIdToWorldObject.get(pair.bodyA.id)
      const woB = matterIdToWorldObject.get(pair.bodyB.id)

      if (woA && woB) {
        handleEvent(woA.name, 'collide', { other: woB.object, otherName: woB.name })
        handleEvent(woB.name, 'collide', { other: woA.object, otherName: woA.name })
      }
    })
  })

  Matter.Events.on(engine, 'collisionEnd', event => {
    event.pairs.forEach(pair => {
      const woA = matterIdToWorldObject.get(pair.bodyA.id)
      const woB = matterIdToWorldObject.get(pair.bodyB.id)

      if (woA && woB) {
        handleEvent(woA.name, 'uncollide', { other: woB.object, otherName: woB.name })
        handleEvent(woB.name, 'uncollide', { other: woA.object, otherName: woA.name })
      }
    })
  })

</script>

<template>
  <div id="mindstorm-player">
    <World
      :world="world"
      @drag="handleDrag"
      @dragstart="handleDragstart"
      @dragend="handleDragstop"
      @click="handleClick"
      clip
    >
      <template v-slot:overlay>
        <g style="pointer-events: none;">
          <BoundingRectangle
            v-for="part in world.parts"
            v-bind="part"
            state="passive"
          />
          <Constraint
            v-for="name in Object.keys(world.connections)"
            :key="name"
            :selected="false"
            :world="world"
            :name="name"
          />
        </g>
      </template>
    </World>
    <canvas
      ref="canvas"
    />
  </div>
</template>

<style>
  #mindstorm-player {
    width: 100%;
    height: 100%;
    background: black;
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  #mindstorm-player svg {
    width: 98%;
    height: 98%;
    display: block;
    overflow: visible;
  }

  #mindstorm-player canvas {
    height: 98%;
    margin: 1%;
    position: absolute;
    pointer-events: none;
  }
</style>