<script setup>
  import * as Matter from 'matter-js'
  import World from './world.vue'
  import { ref, reactive } from 'vue'
  import { useAnimationLoop } from './animation-loop.js'
  import { useKeyboardEvents } from './keyboard.js'

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
      const { x, y, width, height, angle } = object
      const body = Matter.Bodies.rectangle(x, y, width, height, { isStatic: object.static, angle: angle*Math.PI/180 })
      Matter.Composite.add(engine.world, body)
      matterIdToObject.set(body.id, object)
    })

  Matter.Events.on(engine, 'afterUpdate', function() {
    Matter.Composite.allBodies(engine.world).forEach(function(body) {
      const o = matterIdToObject.get(body.id)
      const p = body.position
      if (Math.abs(o.x-p.x) > 0.5) o.x = p.x
      if (Math.abs(o.y-p.y) > 0.5) o.y = p.y
    })
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

</script>

<template>
  <div id="mindstorm-player">
    <World
      :world="world"
      @drag="handleDrag"
      @click="handleClick"
      clip
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
    width: 99%;
    height: 99%;
    display: block;
    overflow: visible;
  }
</style>