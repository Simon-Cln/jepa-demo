"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { type Grid, type Pos, CELL, ROWS, COLS, AGENT_DEFS } from "@/lib/robotique/types"
import { GOAL } from "@/lib/robotique/gridMaps"

interface Props {
  grid: Grid
  positions: Record<string, Pos>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metrics: Record<string, any>
}

interface SceneRefs {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.OrthographicCamera
  robots: Map<string, THREE.Mesh>
  targets: Map<string, THREE.Vector3>
  wallMeshes: Map<string, THREE.Mesh>
  frameId: number
  goalLight: THREE.PointLight
  goalRing: THREE.Mesh
  t: number
}

const FLOOR_COLOR = 0x161616
const WALL_COLOR  = 0x252525
const FLOOR_ALT   = 0x111111

export default function RoboticScene({ grid, positions, metrics }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef     = useRef<SceneRefs | null>(null)

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const W = container.clientWidth || 800
    const H = container.clientHeight || 600

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setClearColor(0x0d0d0d)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    container.appendChild(renderer.domElement)

    // Scene
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x0d0d0d, 0.018)

    // Camera — true orthographic isometric
    const aspect = W / H
    const frustum = Math.max(ROWS, COLS) * CELL * 0.72
    const camera = new THREE.OrthographicCamera(
      -frustum * aspect, frustum * aspect,
       frustum,          -frustum,
       0.1, 300
    )
    const cx = (COLS - 1) * CELL / 2
    const cz = (ROWS - 1) * CELL / 2
    camera.position.set(cx + frustum * 1.2, frustum * 1.5, cz + frustum * 1.2)
    camera.lookAt(cx, 0, cz)

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.45)
    scene.add(ambient)

    const sun = new THREE.DirectionalLight(0xfff5e0, 1.4)
    sun.position.set(20, 30, 20)
    sun.castShadow = true
    sun.shadow.mapSize.width  = 2048
    sun.shadow.mapSize.height = 2048
    sun.shadow.camera.near   = 1
    sun.shadow.camera.far    = 200
    sun.shadow.camera.left   = -30
    sun.shadow.camera.right  =  30
    sun.shadow.camera.top    =  30
    sun.shadow.camera.bottom = -30
    sun.shadow.bias          = -0.001
    scene.add(sun)

    const fill = new THREE.DirectionalLight(0x4488ff, 0.3)
    fill.position.set(-15, 10, -15)
    scene.add(fill)

    // Floor base plane (large, dark)
    const basePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(COLS * CELL + 2, ROWS * CELL + 2),
      new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 1 })
    )
    basePlane.rotation.x = -Math.PI / 2
    basePlane.position.set(cx, -0.05, cz)
    basePlane.receiveShadow = true
    scene.add(basePlane)

    // Grid helper (subtle lines)
    const gridHelper = new THREE.GridHelper(
      Math.max(ROWS, COLS) * CELL * 2, Math.max(ROWS, COLS) * 2,
      0x222222, 0x1a1a1a
    )
    gridHelper.position.set(cx, 0.01, cz)
    scene.add(gridHelper)

    // Build floor tiles and walls
    const wallMeshes = new Map<string, THREE.Mesh>()

    const floorGeo  = new THREE.BoxGeometry(CELL * 0.92, 0.08, CELL * 0.92)
    const wallGeo   = new THREE.BoxGeometry(CELL * 0.92, 0.75, CELL * 0.92)
    const floorMat  = new THREE.MeshStandardMaterial({ color: FLOOR_COLOR, roughness: 0.9, metalness: 0.05 })
    const floorAltM = new THREE.MeshStandardMaterial({ color: FLOOR_ALT,  roughness: 0.9, metalness: 0.05 })
    const wallMat   = new THREE.MeshStandardMaterial({ color: WALL_COLOR, roughness: 0.85, metalness: 0.1 })

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = grid[r][c]
        const x = c * CELL
        const z = r * CELL

        if (cell === 1) {
          const m = new THREE.Mesh(wallGeo, wallMat)
          m.position.set(x, 0.375, z)
          m.castShadow = true
          m.receiveShadow = true
          scene.add(m)
          wallMeshes.set(`${r},${c}`, m)
        } else {
          const mat = (r + c) % 2 === 0 ? floorMat : floorAltM
          const m = new THREE.Mesh(floorGeo, mat)
          m.position.set(x, 0, z)
          m.receiveShadow = true
          scene.add(m)
        }
      }
    }

    // Goal marker
    const gx = GOAL.col * CELL
    const gz = GOAL.row * CELL

    const padGeo = new THREE.CylinderGeometry(CELL * 0.38, CELL * 0.38, 0.04, 32)
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 1.2,
      roughness: 0.3, metalness: 0.4,
    })
    const pad = new THREE.Mesh(padGeo, padMat)
    pad.position.set(gx, 0.06, gz)
    scene.add(pad)

    const ringGeo = new THREE.TorusGeometry(CELL * 0.42, 0.04, 8, 48)
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 3,
    })
    const goalRing = new THREE.Mesh(ringGeo, ringMat)
    goalRing.rotation.x = Math.PI / 2
    goalRing.position.set(gx, 0.08, gz)
    scene.add(goalRing)

    const goalLight = new THREE.PointLight(0x00ff88, 3, CELL * 5)
    goalLight.position.set(gx, 1.5, gz)
    scene.add(goalLight)

    // Robots
    const robots  = new Map<string, THREE.Mesh>()
    const targets = new Map<string, THREE.Vector3>()
    const sx = 1 * CELL, sz = 1 * CELL

    for (const agent of AGENT_DEFS) {
      const geo = new THREE.CapsuleGeometry(0.22, 0.18, 6, 12)
      const mat = new THREE.MeshStandardMaterial({
        color: agent.hex,
        emissive: agent.hex,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.6,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(sx, 0.42, sz)
      mesh.castShadow = true
      scene.add(mesh)
      robots.set(agent.id, mesh)
      targets.set(agent.id, new THREE.Vector3(sx, 0.42, sz))
    }

    // Animate
    let t = 0
    function animate() {
      const frameId = requestAnimationFrame(animate)
      if (sceneRef.current) sceneRef.current.frameId = frameId

      t += 0.016
      if (sceneRef.current) sceneRef.current.t = t

      // Pulse goal
      goalLight.intensity = 2.5 + Math.sin(t * 2.5) * 0.8
      goalRing.rotation.z = t * 0.6

      // Smooth robot movement + bob
      const robotIds = Array.from(robots.keys())
      robots.forEach((mesh, id) => {
        const target = targets.get(id)
        if (!target) return
        mesh.position.x += (target.x - mesh.position.x) * 0.18
        mesh.position.z += (target.z - mesh.position.z) * 0.18
        mesh.position.y = 0.42 + Math.sin(t * 3 + robotIds.indexOf(id) * 1.2) * 0.04
      })

      renderer.render(scene, camera)
    }
    const frameId = requestAnimationFrame(animate)

    sceneRef.current = { renderer, scene, camera, robots, targets, wallMeshes, frameId, goalLight, goalRing, t: 0 }

    // Resize
    const onResize = () => {
      const W2 = container.clientWidth
      const H2 = container.clientHeight
      renderer.setSize(W2, H2)
      const aspect2 = W2 / H2
      const frustum2 = Math.max(ROWS, COLS) * CELL * 0.72
      camera.left   = -frustum2 * aspect2
      camera.right  =  frustum2 * aspect2
      camera.top    =  frustum2
      camera.bottom = -frustum2
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(frameId)
      renderer.dispose()
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
      sceneRef.current = null
    }
  }, []) // eslint-disable-line

  // ── Update robot positions ────────────────────────────────────────────────
  useEffect(() => {
    if (!sceneRef.current) return
    const { targets } = sceneRef.current
    for (const [id, pos] of Object.entries(positions)) {
      const t = targets.get(id)
      if (t) t.set(pos.col * CELL, 0.42, pos.row * CELL)
    }
  }, [positions])

  // ── Update grid (dynamic obstacles) ──────────────────────────────────────
  useEffect(() => {
    if (!sceneRef.current) return
    const { scene, wallMeshes } = sceneRef.current

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const key = `${r},${c}`
        const isWall = grid[r][c] === 1
        if (isWall && !wallMeshes.has(key)) {
          const geo = new THREE.BoxGeometry(CELL * 0.92, 0.75, CELL * 0.92)
          const mat = new THREE.MeshStandardMaterial({ color: 0xff3333, roughness: 0.7, emissive: 0x440000 })
          const m = new THREE.Mesh(geo, mat)
          m.position.set(c * CELL, 0.375, r * CELL)
          m.scale.y = 0
          m.castShadow = true
          scene.add(m)
          wallMeshes.set(key, m)
          // Animate spawn
          let sy = 0
          const grow = setInterval(() => {
            sy = Math.min(1, sy + 0.08)
            m.scale.y = sy
            if (sy >= 1) clearInterval(grow)
          }, 16)
        }
      }
    }
  }, [grid])

  // Suppress unused metrics warning — metrics prop reserved for future use (e.g. done overlays)
  void metrics

  return <div ref={containerRef} className="w-full h-full" />
}
