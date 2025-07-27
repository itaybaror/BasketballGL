import { OrbitControls } from './OrbitControls.js'

// ────────── scene / camera / renderer ──────────
const scene   = new THREE.Scene()
const camera  = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
document.body.appendChild(renderer.domElement)
scene.background = new THREE.Color(0x000000)

// ────────── lights ──────────
scene.add(new THREE.AmbientLight(0xffffff, 0.5))
const dir = new THREE.DirectionalLight(0xffffff, 0.8)
dir.position.set(10, 20, 15)
dir.castShadow = true
scene.add(dir)

// ────────── court floor ──────────
function createCourtFloor() {
  const g = new THREE.BoxGeometry(30, 0.2, 15)
  const m = new THREE.MeshPhongMaterial({ color: 0xc68642, shininess: 50 })
  const mesh = new THREE.Mesh(g, m)
  mesh.receiveShadow = true
  scene.add(mesh)
}

// ────────── court lines ──────────
function createCourtLines() {
  const y = 0.11
  const mat = new THREE.LineBasicMaterial({ color: 0xffffff })

  scene.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, y, -7.5),
      new THREE.Vector3(0, y, 7.5)
    ]),
    mat
  ))

  const circ = []
  for (let i = 0; i < 64; i++) {
    const t = (i / 64) * Math.PI * 2
    circ.push(new THREE.Vector3(2 * Math.cos(t), y, 2 * Math.sin(t)))
  }
  scene.add(new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(circ),
    mat
  ))

  ;[1, -1].forEach(sign => {
    const pts = []
    for (let i = 0; i <= 36; i++) {
      const th = -Math.PI / 2 + (i / 36) * Math.PI
      const x = 15 * sign - 6 * Math.cos(th) * sign
      const z = 6 * Math.sin(th)
      pts.push(new THREE.Vector3(x, y, z))
    }
    scene.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      mat
    ))
  })
}

// ────────── single hoop ──────────
function createHoop(sign) {
  const root = new THREE.Group()
  const bx = 15 * sign

  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 1.5),
    new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
  )
  board.position.set(bx, 3.25, 0)
  board.rotation.y = -Math.PI / 2 * sign
  board.castShadow = true
  root.add(board)

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.05, 16, 32),
    new THREE.MeshPhongMaterial({ color: 0xff8c00 })
  )
  rim.position.set(bx - 0.35 * sign, 3, 0)
  rim.rotation.x = Math.PI / 2
  rim.castShadow = true
  root.add(rim)

  // net lines
  const topR = 0.3, botR = 0.15, netH = 0.5, yTop = 2.95
  const top = [], bot = []
  for (let i = 0; i < 8; i++) {
    const p = (i / 8) * Math.PI * 2
    top.push(new THREE.Vector3(
      rim.position.x + topR * Math.cos(p),
      yTop,
      topR * Math.sin(p)
    ))
    bot.push(new THREE.Vector3(
      rim.position.x + botR * Math.cos(p),
      3 - netH,
      botR * Math.sin(p)
    ))
  }
  const netMat = new THREE.LineBasicMaterial({ color: 0xffffff })
  for (let i = 0; i < 8; i++) {
    root.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([ top[i], bot[i] ]),
      netMat
    ))
  }
  root.add(new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(bot),
    netMat
  ))

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 4, 8),
    new THREE.MeshPhongMaterial({ color: 0x888888 })
  )
  pole.position.set(17 * sign, 2, 0)
  pole.castShadow = true
  root.add(pole)

  const poleTop = new THREE.Vector3(17 * sign, 4, 0)
  const attach = new THREE.Vector3(bx - 0.1 * sign, 3, 0)
  const armVec = attach.clone().sub(poleTop)
  const arm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, armVec.length(), 8),
    new THREE.MeshPhongMaterial({ color: 0x888888 })
  )
  arm.position.copy(poleTop.clone().addScaledVector(armVec, 0.5))
  arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), armVec.clone().normalize())
  arm.castShadow = true
  root.add(arm)

  scene.add(root)
}

// ────────── basketball (static) ──────────
function createBasketball() {
  // Create basketball group and ball mesh
  ballGroup = new THREE.Group()
  const r = ballRadius
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(r, 32, 32),
    new THREE.MeshPhongMaterial({ color: 0xff8c00 })
  )
  ball.castShadow = true
  ballGroup.add(ball)
  // Add seams (three great circles) as LineLoops
  const seamMat = new THREE.LineBasicMaterial({ color: 0x000000 })
  const loop = fn => {
    const pts = []
    for (let i = 0; i < 64; i++) {
      const t = (i / 64) * Math.PI * 2
      pts.push(fn(t))
    }
    return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), seamMat)
  }
  ballGroup.add(loop(t => new THREE.Vector3(r * Math.cos(t), 0, r * Math.sin(t))))
  ballGroup.add(loop(t => new THREE.Vector3(0, r * Math.cos(t), r * Math.sin(t))))
  ballGroup.add(loop(t => new THREE.Vector3(r * Math.cos(t), r * Math.sin(t), 0)))
  // Set initial position (center court) and add to scene
  ballGroup.position.set(0, r + 0.1, 0)
  scene.add(ballGroup)
}

// ────────── build whole court ──────────
function createBasketballCourt() {
  createCourtFloor()
  createCourtLines()
  createHoop(1)
  createHoop(-1)
  createBasketball()
}

// ────────── game state and physics variables ──────────
let ballGroup
const ballRadius = 0.25
let ballVelocity = new THREE.Vector3(0, 0, 0)
let ballShot = false
let ballSpinAxis = new THREE.Vector3(0, 0, 0)
let ballAngularSpeed = 0
let shotAttempts = 0, shotsMade = 0, score = 0
let shotPower = 50
const moveSpeed = 5
const gravity = -9.8, restitution = 0.7, friction = 0.7
const groundLevel = ballRadius + 0.1
const hoopCenterX = 14.65
const hoopRadius = 0.3
const targetHoop = new THREE.Vector3()
let ballScoredThisShot = false
let shotResultShown = false
let keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false }
let prevTime = performance.now()

createBasketballCourt()

// ────────── camera / controls ──────────
camera.position.set(0, 15, 30)
const controls = new OrbitControls(camera, renderer.domElement)
let orbitEnabled = true
document.addEventListener('keydown', e => {
  if (e.key === 'o' || e.key === 'O') {
    orbitEnabled = !orbitEnabled
  }
})

// ────────── UI framework preparation ──────────
function setupUI() {
  const style = document.createElement('style')
  style.textContent = `
    .ui-box {
      position: absolute;
      color: #ffffff;
      font-family: Arial, sans-serif;
      user-select: none;
      pointer-events: none;
      line-height: 1.4;
    }
    #scoreBox    { top: 15px; left: 50%; transform: translateX(-50%); font-size: 24px; }
    #controlsBox { bottom: 20px; left: 20px; font-size: 16px; }
    #powerBox    { bottom: 20px; right: 20px; font-size: 18px; }
    #messageBox  { top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 32px; font-weight: bold; }
  `
  document.head.appendChild(style)

  const scoreBox = document.createElement('div')
  scoreBox.id = 'scoreBox'
  scoreBox.className = 'ui-box'
  scoreBox.textContent = 'Score: 0 | Shots: 0/0 (0%)'
  document.body.appendChild(scoreBox)

  const controlsBox = document.createElement('div')
  controlsBox.id = 'controlsBox'
  controlsBox.className = 'ui-box'
  controlsBox.innerHTML =
    '<strong>Controls:</strong><br><br>' +
    'O – Toggle orbit camera<br>' +
    'Arrow Keys – Move ball<br>' +
    'W/S – Adjust shot power<br>' +
    'SPACE – Shoot ball<br>' +
    'R – Reset ball'
  document.body.appendChild(controlsBox)

  const powerBox = document.createElement('div')
  powerBox.id = 'powerBox'
  powerBox.className = 'ui-box'
  powerBox.textContent = 'Power: ' + shotPower + '%'
  document.body.appendChild(powerBox)

  const messageBox = document.createElement('div')
  messageBox.id = 'messageBox'
  messageBox.className = 'ui-box'
  messageBox.textContent = ''
  document.body.appendChild(messageBox)
}
setupUI()

// Get references to dynamic UI elements
const scoreBoxElem = document.getElementById('scoreBox')
const powerBoxElem = document.getElementById('powerBox')
const messageBoxElem = document.getElementById('messageBox')

// ────────── keyboard controls events ──────────
document.addEventListener('keydown', e => {
  switch (e.key) {
    case 'ArrowUp':
      keys.ArrowUp = true
      e.preventDefault()
      break
    case 'ArrowDown':
      keys.ArrowDown = true
      e.preventDefault()
      break
    case 'ArrowLeft':
      keys.ArrowLeft = true
      e.preventDefault()
      break
    case 'ArrowRight':
      keys.ArrowRight = true
      e.preventDefault()
      break
    case 'w':
    case 'W':
      shotPower = Math.min(100, shotPower + 5)
      powerBoxElem.textContent = 'Power: ' + shotPower + '%'
      break
    case 's':
    case 'S':
      shotPower = Math.max(0, shotPower - 5)
      powerBoxElem.textContent = 'Power: ' + shotPower + '%'
      break
    case ' ':
    case 'Space':
      if (!ballShot) {
        // Start a new shot
        ballShot = true
        shotAttempts += 1
        ballScoredThisShot = false
        shotResultShown = false
        // Determine nearest hoop (left or right)
        const sign = (ballGroup.position.x >= 0) ? 1 : -1
        targetHoop.set(hoopCenterX * sign, 3, 0)
        // Compute initial velocity based on power and angle
        const maxSpeed = 15
        const initialSpeed = (shotPower / 100) * maxSpeed
        const dx = targetHoop.x - ballGroup.position.x
        const dz = targetHoop.z - ballGroup.position.z
        const horizontalDist = Math.sqrt(dx * dx + dz * dz)
        // Use 45° if not too close, otherwise 90° straight up if almost under hoop
        const angle = (horizontalDist < 0.1) ? Math.PI / 2 : Math.PI / 4
        const horizontalSpeed = initialSpeed * Math.cos(angle)
        const verticalSpeed = initialSpeed * Math.sin(angle)
        // Horizontal direction unit vector
        const horizDir = new THREE.Vector3(dx, 0, dz)
        if (horizDir.lengthSq() > 0) {
          horizDir.normalize()
        } else {
          horizDir.set(sign, 0, 0)  // arbitrary horizontal direction if directly under hoop
        }
        // Set velocity components
        ballVelocity.x = horizDir.x * horizontalSpeed
        ballVelocity.z = horizDir.z * horizontalSpeed
        ballVelocity.y = verticalSpeed
        // Set spin axis (perpendicular to travel direction) and angular speed
        if (horizDir.lengthSq() > 0) {
          const horizVel = new THREE.Vector3(ballVelocity.x, 0, ballVelocity.z).normalize()
          ballSpinAxis.copy(horizVel).cross(new THREE.Vector3(0, 1, 0)).normalize()
        } else {
          ballSpinAxis.set(1, 0, 0)  // vertical shot: spin around arbitrary horizontal axis
        }
        ballAngularSpeed = ballVelocity.length() / ballRadius
        // Update scoreboard attempts (shotsMade unchanged for now)
        const percent = (shotAttempts > 0) ? Math.round((shotsMade / shotAttempts) * 100) : 0
        scoreBoxElem.textContent = `Score: ${score} | Shots: ${shotsMade}/${shotAttempts} (${percent}%)`
      }
      e.preventDefault()
      break
    case 'r':
    case 'R':
      // Reset ball to center
      ballShot = false
      ballVelocity.set(0, 0, 0)
      ballGroup.position.set(0, ballRadius + 0.1, 0)
      shotPower = 50
      powerBoxElem.textContent = 'Power: ' + shotPower + '%'
      messageBoxElem.textContent = ''
      break
    default:
      break
  }
})
document.addEventListener('keyup', e => {
  switch (e.key) {
    case 'ArrowUp':
      keys.ArrowUp = false
      break
    case 'ArrowDown':
      keys.ArrowDown = false
      break
    case 'ArrowLeft':
      keys.ArrowLeft = false
      break
    case 'ArrowRight':
      keys.ArrowRight = false
      break
    default:
      break
  }
})

// ────────── render loop ──────────
function animate() {
  requestAnimationFrame(animate)
  // Calculate delta time for smooth physics
  const currentTime = performance.now()
  let deltaTime = (currentTime - prevTime) / 1000
  prevTime = currentTime
  if (deltaTime > 0.1) deltaTime = 0.1  // clamp to avoid big jumps

  if (ballShot) {
    // Physics update for a shot in progress
    const prevY = ballGroup.position.y
    // Apply gravity to vertical velocity
    ballVelocity.y += gravity * deltaTime
    // Update ball position from velocity
    ballGroup.position.x += ballVelocity.x * deltaTime
    ballGroup.position.y += ballVelocity.y * deltaTime
    ballGroup.position.z += ballVelocity.z * deltaTime
    // Scoring detection: check if ball passes through hoop from above
    if (!ballScoredThisShot && ballVelocity.y < 0 && prevY >= 3 && ballGroup.position.y < 3) {
      const dx = ballGroup.position.x - targetHoop.x
      const dz = ballGroup.position.z - targetHoop.z
      const horizDist = Math.sqrt(dx * dx + dz * dz)
      if (horizDist <= hoopRadius) {
        // Ball is within hoop cylinder when falling down: count as score
        ballScoredThisShot = true
        shotsMade += 1
        score += 2
        // Update scoreboard for made shot
        const percent = Math.round((shotsMade / shotAttempts) * 100) || 0
        scoreBoxElem.textContent = `Score: ${score} | Shots: ${shotsMade}/${shotAttempts} (${percent}%)`
        // Show "SHOT MADE!" feedback
        if (!shotResultShown) {
          messageBoxElem.textContent = 'SHOT MADE!'
          shotResultShown = true
          setTimeout(() => { messageBoxElem.textContent = '' }, 2000)
        }
      }
    }
    // Rotate ball in flight
    ballGroup.rotateOnWorldAxis(ballSpinAxis, ballAngularSpeed * deltaTime)
    // Ground collision and bounce
    if (ballGroup.position.y <= groundLevel) {
      ballGroup.position.y = groundLevel
      if (ballVelocity.y < 0) {
        // Ball hit the ground: bounce up with reduced energy
        ballVelocity.y = -ballVelocity.y * restitution
        ballVelocity.x *= friction
        ballVelocity.z *= friction
        // Show "MISSED SHOT" feedback on first ground hit if not scored
        if (!shotResultShown) {
          messageBoxElem.textContent = 'MISSED SHOT'
          shotResultShown = true
          setTimeout(() => { messageBoxElem.textContent = '' }, 2000)
        }
      }
      // Stop the ball if it is moving very slowly (end of bouncing)
      const speed = Math.sqrt(ballVelocity.x**2 + ballVelocity.y**2 + ballVelocity.z**2)
      if (speed < 1) {
        ballShot = false
        ballVelocity.set(0, 0, 0)
        ballGroup.position.y = groundLevel
      }
    }
  } else {
    // Ball is not in the air: allow movement with arrow keys
    if (keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight) {
      // Determine movement direction based on keys pressed
      const moveDir = new THREE.Vector3(
        (keys.ArrowLeft ? -1 : 0) + (keys.ArrowRight ? 1 : 0),
        0,
        (keys.ArrowUp ? -1 : 0) + (keys.ArrowDown ? 1 : 0)
      )
      if (moveDir.lengthSq() > 0) {
        moveDir.normalize()
        const distance = moveSpeed * deltaTime
        moveDir.multiplyScalar(distance)
        // Update ball position and clamp within court bounds
        ballGroup.position.add(moveDir)
        ballGroup.position.x = Math.max(-14.75, Math.min(14.75, ballGroup.position.x))
        ballGroup.position.z = Math.max(-7.25, Math.min(7.25, ballGroup.position.z))
        ballGroup.position.y = groundLevel
        // Rotate ball as it rolls on the ground
        const axis = moveDir.clone().normalize().cross(new THREE.Vector3(0, 1, 0)).normalize()
        const angle = distance / ballRadius
        if (axis.lengthSq() > 0) {
          ballGroup.rotateOnWorldAxis(axis, angle)
        }
      }
    }
  }

  // Update camera orbit control and render scene
  controls.enabled = orbitEnabled
  controls.update()
  renderer.render(scene, camera)
}
animate()