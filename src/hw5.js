import {OrbitControls} from './OrbitControls.js'

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
function createCourtFloor () {
  const g = new THREE.BoxGeometry(30, 0.2, 15)
  const m = new THREE.MeshPhongMaterial({ color: 0xc68642, shininess: 50 })
  const mesh = new THREE.Mesh(g, m)
  mesh.receiveShadow = true
  scene.add(mesh)
}

// ────────── court lines ──────────
function createCourtLines () {
  const y = 0.11
  const mat = new THREE.LineBasicMaterial({ color: 0xffffff })

  scene.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([ new THREE.Vector3(0, y, -7.5), new THREE.Vector3(0, y, 7.5) ]),
    mat))

  const circ = []
  for (let i = 0; i < 64; i++) {
    const t = i / 64 * Math.PI * 2
    circ.push(new THREE.Vector3(2 * Math.cos(t), y, 2 * Math.sin(t)))
  }
  scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(circ), mat))

  ;[1, -1].forEach(sign => {
    const pts = []
    for (let i = 0; i <= 36; i++) {
      const th = -Math.PI / 2 + (i / 36) * Math.PI
      const x  = 15 * sign - 6 * Math.cos(th) * sign
      const z  = 6 * Math.sin(th)
      pts.push(new THREE.Vector3(x, y, z))
    }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat))
  })
}

// ────────── single hoop ──────────
function createHoop (sign) {
  const root = new THREE.Group()
  const bx   = 15 * sign

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

  const topR=0.3, botR=0.15, netH=0.5, yTop=2.95
  const top=[], bot=[]
  for (let i=0; i<8; i++) {
    const p = i/8*Math.PI*2
    top.push(new THREE.Vector3(rim.position.x+topR*Math.cos(p), yTop,    topR*Math.sin(p)))
    bot.push(new THREE.Vector3(rim.position.x+botR*Math.cos(p), 3-netH,  botR*Math.sin(p)))
  }
  const netMat=new THREE.LineBasicMaterial({color:0xffffff})
  for (let i=0;i<8;i++){
    root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([top[i],bot[i]]), netMat))
  }
  root.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(bot), netMat))

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,4,8), new THREE.MeshPhongMaterial({color:0x888888}))
  pole.position.set(17*sign,2,0)
  pole.castShadow = true
  root.add(pole)

  const poleTop = new THREE.Vector3(17*sign,4,0)
  const attach  = new THREE.Vector3(bx-0.1*sign,3,0)
  const armVec  = attach.clone().sub(poleTop)
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,armVec.length(),8), new THREE.MeshPhongMaterial({color:0x888888}))
  arm.position.copy(poleTop.clone().addScaledVector(armVec,0.5))
  arm.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), armVec.clone().normalize())
  arm.castShadow=true
  root.add(arm)

  scene.add(root)
}

// ────────── basketball (static) ──────────
function createBasketball () {
  const group=new THREE.Group()
  const r=0.25
  const ball=new THREE.Mesh(new THREE.SphereGeometry(r,32,32), new THREE.MeshPhongMaterial({color:0xff8c00}))
  ball.castShadow=true
  group.add(ball)

  const seamMat=new THREE.LineBasicMaterial({color:0x000000})
  const loop = fn=>{
    const pts=[]
    for(let i=0;i<64;i++){const t=i/64*Math.PI*2;pts.push(fn(t))}
    return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), seamMat)
  }
  group.add(loop(t=>new THREE.Vector3(r*Math.cos(t),0,r*Math.sin(t))))
  group.add(loop(t=>new THREE.Vector3(0,r*Math.cos(t),r*Math.sin(t))))
  group.add(loop(t=>new THREE.Vector3(r*Math.cos(t),r*Math.sin(t),0)))

  group.position.set(0,r+0.1,0)
  scene.add(group)
}

// ────────── build whole court ──────────
function createBasketballCourt () {
  createCourtFloor()
  createCourtLines()
  createHoop( 1)
  createHoop(-1)
  createBasketball()
}
createBasketballCourt()

// ────────── camera / controls ──────────
camera.position.set(0,15,30)
const controls = new OrbitControls(camera, renderer.domElement)
let orbitEnabled = true
document.addEventListener('keydown', e => { if (e.key === 'o') orbitEnabled = !orbitEnabled })

// ────────── UI framework preparation ──────────
function setupUI () {
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
  `
  document.head.appendChild(style)

  const scoreBox = document.createElement('div')
  scoreBox.id = 'scoreBox'
  scoreBox.className = 'ui-box'
  scoreBox.textContent = 'Score: 0 - 0'
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
}
setupUI()

// ────────── render loop ──────────
function animate () {
  requestAnimationFrame(animate)
  controls.enabled = orbitEnabled
  controls.update()
  renderer.render(scene, camera)
}
animate()