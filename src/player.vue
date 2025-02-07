<script setup>
  import * as Matter from 'matter-js'
  import World from './world.vue'
  import { ref, reactive, watch } from 'vue'
  import { useAnimationLoop } from './helpers/animation.js'
  import { useKeyboardEvents } from './helpers/keyboard.js'

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
      .forEach(([name1, object1]) => {
        let { initialize, step, collide, uncollide, collisions } = object1
        if (!initialized.has(name1)) {
          initialized.add(name1)
          if (initialize) {
            try {
              const event = {}

              const scopedHandler = new Function('world', 'event', `with (world, event) { ${initialize} }`)
              const result = scopedHandler.bind(world.parts[name1])(world, event)
            }
            catch (error) {
              console.error('Error:', error.message)
            }
          }
        }
        if (step) {
          try {
            const event = {}

            const scopedHandler = new Function('world', 'event', `with (world, event) { ${step} }`)
            const result = scopedHandler.bind(world.parts[name1])(world, event)
          }
          catch (error) {
            console.error('Error:', error.message)
          }
        }
      })
  })

  Object.keys(world).forEach(key => delete world[key])
  Object.assign(world, mindstorm)

  const matterIdToObject = new Map()

  Object
    .entries(world.parts)
    .forEach(([ name, object ]) => {
      const { x, y, width, height, angle, parts={} } = object
      const body = Matter.Bodies.rectangle(x, y, width, height, { angle: angle*Math.PI/180 })

      const bodies = [body]

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

        bodies.push(partBody)
      })

      const compositeBody = Matter.Body.create({
        parts: bodies,
        angle: angle*Math.PI/180,
        isStatic: object.static
      })

      Matter.World.add(engine.world, compositeBody)
      matterIdToObject.set(compositeBody.id, object)
    })

  Matter.Events.on(engine, 'afterUpdate', function() {
    Matter.Composite.allBodies(engine.world).forEach(function(body) {
      const o = matterIdToObject.get(body.id)
      if (!o) return // this is the case when the body is a part of the object

      const p = body.position

      if (!!o.static !== !!body.isStatic) {
        Matter.Body.setStatic(body, !!o.static)
      }

      if (o.static) Matter.Body.setPosition(body, o)
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
    const render = Matter.Render.create({
      canvas: canvas.value,
      engine,
      options: {
        wireframes: true,
        width: 100,
        height: 100
      }
    })
    Matter.Render.run(render)
  })



  function handleClick({target: name, event: rawEvent}) {
    const handler = world.parts?.[name]?.click
    if (handler) {
      try {
        const event = {}
        const scopedHandler = new Function('world', 'event', `with (world, event) { ${handler} }`)
        const result = scopedHandler.bind(world.parts[name])(world, event)
      } catch (error) {
        console.error('Error:', error.message)
      }
    }
  }

  function handleDrag({target: name, event }) {
    const { detail: { svg_x:x, svg_y:y, svg_dx:dx, svg_dy:dy } } = event
    const handler = world.parts?.[name]?.drag
    if (handler) {
      try {
        const event = { x, y, dx, dy }
        const scopedHandler = new Function('world', 'event', `with (world, event) { ${handler} }`)
        const result = scopedHandler.bind(world.parts[name])(world, event)
      } catch (error) {
        console.error('Error:', error.message)
      }
    }
  }

  function handleDragstart({target: name, event }) {
    const { detail: { svg_x:x, svg_y:y, svg_dx:dx, svg_dy:dy } } = event
    const handler = world.parts?.[name]?.dragstart
    if (handler) {
      try {
        const event = { x, y, dx, dy }
        const scopedHandler = new Function('world', 'event', `with (world, event) { ${handler} }`)
        const result = scopedHandler.bind(world.parts[name])(world, event)
      } catch (error) {
        console.error('Error:', error.message)
      }
    }
  }

  function handleDragstop({target: name, event }) {
    const handler = world.parts?.[name]?.dragend
    if (handler) {
      try {
        const event = {}
        const scopedHandler = new Function('world', 'event', `with (world, event) { ${handler} }`)
        const result = scopedHandler.bind(world.parts[name])(world, event)
      } catch (error) {
        console.error('Error:', error.message)
      }
    }
  }

  function distance(a, b) {
    const x = a.x-b.x
    const y = a.y-b.y
    return Math.sqrt(x*x + y*y)
  }








function handleEvent(object, name, event) {
  if (object.parts?.[name]) {
    try {
      const scopedHandler = new Function('world', 'event', `with (world, event) { ${object?.[name]} }`)
      const result = scopedHandler.bind(object)(world, event)
    } catch (error) {
      console.error('Error:', error.message)
    }
  }
}

Matter.Events.on(engine, 'collisionStart', event => {
  event.pairs.forEach(pair => {
    const objectA = matterIdToObject.get(pair.bodyA.parent.id)
    const objectB = matterIdToObject.get(pair.bodyB.parent.id)

    if (objectA && objectB) {
      handleEvent(objectA, 'collide', { other: objectB })
      handleEvent(objectB, 'collide', { other: objectA })
    }
  })
})

Matter.Events.on(engine, 'collisionEnd', event => {
  event.pairs.forEach(pair => {
    const objectA = matterIdToObject.get(pair.bodyA.parent.id)
    const objectB = matterIdToObject.get(pair.bodyB.parent.id)

    if (objectA && objectB) {
      handleEvent(objectA, 'uncollide', { other: objectB })
      handleEvent(objectB, 'uncollide', { other: objectA })
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
    />
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
    opacity: 0.25;
    pointer-events: none;
  }
</style>