<script setup>
  import * as Matter from 'matter-js'
  import World from './world.vue'
  import { ref, reactive, watch } from 'vue'
  import { useAnimationLoop } from './animation-loop.js'
  import { useKeyboardEvents } from './keyboard.js'

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

  function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    )
  }

  const initialized = new Set()

  registerAnimationCallback(() => {
    Object
      .entries(world)
      .forEach(([name1, object1]) => {
        let { handlers, collisions } = object1
        if (!initialized.has(name1)) {
          initialized.add(name1)
          if (handlers?.initialize) {
            try {
              const event = {}

              const scopedHandler = new Function('world', 'event', `with (world, event) { ${handlers.initialize} }`)
              const result = scopedHandler.bind(world[name1])(world, event)
            }
            catch (error) {
              console.error('Error:', error.message)
            }
          }
        }
        if (handlers?.step) {
          try {
            const event = {}

            const scopedHandler = new Function('world', 'event', `with (world, event) { ${handlers.step} }`)
            const result = scopedHandler.bind(world[name1])(world, event)
          }
          catch (error) {
            console.error('Error:', error.message)
          }
        }

        const collisionsSeen = {}

        if (!collisions) {
          world[name1].collisions = {}
          collisions = world[name1].collisions
        }

        Object
          .entries(world)
          .forEach(([name2, object2]) => {
            if (name1 === name2) return

            if (handlers?.collide && checkCollision(object1, object2)) {
              const handler = handlers.collide
              collisionsSeen[name2] = true
              if (collisions[name2]) return

              collisions[name2] = { someCollisionData: false }
              try {
                const event = { other: name2 }

                const scopedHandler = new Function('world', 'event', `with (world, event) { ${handler} }`)
                const result = scopedHandler.bind(world[name])(world, event)
              }
              catch (error) {
                console.error('Error:', error.message)
              }
            }
          })
        Object
          .keys(collisions)
          .forEach(name => {
            if (!collisionsSeen[name]) {
              delete collisions[name]
              if (handlers?.uncollide) {
                const handler = handlers.uncollide
                try {
                  const event = { other: name }
                  const scopedHandler = new Function('world', 'event', `with (world, event) { ${handler} }`)
                  const result = scopedHandler.bind(world[name])(world, event)
                }
                catch (error) {
                  console.error('Error:', error.message)
                }
              }
            }
          })
      })
  })

  Object.keys(world).forEach(key => delete world[key])
  Object.assign(world, mindstorm)

  const matterIdToObject = new Map()

  Object
    .entries(world)
    .forEach(([ name, object ]) => {
      const { x, y, width, height, angle, parts={} } = object
      const body = Matter.Bodies.rectangle(x, y, width, height, { angle: angle*Math.PI/180, isStatic: object.static })

      Object.values(parts).forEach(part => {
        const rotatedPoint = Matter.Vector.rotate({ x: part.x, y: part.y }, angle*Math.PI/180)
        const partPosition = Matter.Vector.add({ x, y }, rotatedPoint)
        const partBody = Matter.Bodies.rectangle(
          partPosition.x,
          partPosition.y,
          part.width,
          part.height,
          {
            angle: (angle + part.angle)*Math.PI/180
          }
        )

        const constraint = Matter.Constraint.create({
          bodyA: body,
          bodyB: partBody,
          pointA: partPosition,
          pointB: { x: 0, y: 0 },
          stiffness: 1,
          length: 0
        })

        //  TODO: add second constraint to "pin" the body
        Matter.World.add(engine.world, partBody)
        Matter.World.add(engine.world, constraint)
      })

      Matter.World.add(engine.world, body)
      matterIdToObject.set(body.id, object)
    })

  Matter.Events.on(engine, 'afterUpdate', function() {
    Matter.Composite.allBodies(engine.world).forEach(function(body) {
      const o = matterIdToObject.get(body.id)
      if (!o) return // this is the case when the body is a part of the object

      const p = body.position
      if (distance(o, p) > 0.1) {
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
        background: '#f4f4f4',
        width: 100,
        height: 100
      }
    })
    Matter.Render.run(render)
  })



  function handleClick({target: name, event: rawEvent}) {
    const handler = world?.[name]?.handlers?.click
    if (handler) {
      try {
        const event = {}
        const scopedHandler = new Function('world', 'event', `with (world, event) { ${handler} }`)
        const result = scopedHandler.bind(world[name])(world, event)
      } catch (error) {
        console.error('Error:', error.message)
      }
    }
  }

  function handleDrag({target: name, event }) {
    const { detail: { svg_x:x, svg_y:y, svg_dx:dx, svg_dy:dy } } = event
    const handler = world?.[name]?.handlers?.drag
    if (handler) {
      try {
        const event = { x, y, dx, dy }
        const scopedHandler = new Function('world', 'event', `with (world, event) { ${handler} }`)
        const result = scopedHandler.bind(world[name])(world, event)
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

</script>

<template>
  <div id="mindstorm-player">
    <World
      :world="world"
      @drag="handleDrag"
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
</style>