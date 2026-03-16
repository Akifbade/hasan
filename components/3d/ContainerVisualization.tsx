'use client'

import { useEffect, useRef } from 'react'

interface Item {
  name: string
  length_cm: number
  width_cm: number
  height_cm: number
  quantity: number
  condition?: string
}

interface Props {
  containerType: '20ft' | '40ft' | 'lcl'
  items: Item[]
  totalVolume: number
}

const CONTAINER_DIMS = {
  '20ft': { l: 589, w: 235, h: 239 }, // cm
  '40ft': { l: 1203, w: 235, h: 239 },
  'lcl': { l: 589, w: 235, h: 239 }, // show 20ft for lcl
}

const ITEM_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1',
]

export default function ContainerVisualization({ containerType, items, totalVolume }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<any>(null)

  useEffect(() => {
    if (!mountRef.current || typeof window === 'undefined') return

    let animationId: number
    let THREE: any

    async function init() {
      THREE = await import('three')
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js' as any)

      const width = mountRef.current!.clientWidth
      const height = 400

      // Scene
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xf8fafc)

      // Camera
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000)
      camera.position.set(800, 600, 1000)
      camera.lookAt(0, 0, 0)

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(width, height)
      renderer.shadowMap.enabled = true
      mountRef.current!.appendChild(renderer.domElement)

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
      scene.add(ambientLight)
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
      dirLight.position.set(500, 800, 500)
      dirLight.castShadow = true
      scene.add(dirLight)

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.05

      // Container dimensions
      const dims = CONTAINER_DIMS[containerType]
      const SCALE = 0.5 // 1cm = 0.5 units

      const cL = dims.l * SCALE
      const cW = dims.w * SCALE
      const cH = dims.h * SCALE

      // Container wireframe
      const containerGeo = new THREE.BoxGeometry(cL, cH, cW)
      const containerMat = new THREE.MeshPhongMaterial({
        color: 0x1e40af,
        wireframe: false,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide,
      })
      const container = new THREE.Mesh(containerGeo, containerMat)
      container.position.set(0, cH / 2, 0)
      scene.add(container)

      // Container edges
      const edgesGeo = new THREE.EdgesGeometry(containerGeo)
      const edgesMat = new THREE.LineBasicMaterial({ color: 0x1e40af, linewidth: 2 })
      const edges = new THREE.LineSegments(edgesGeo, edgesMat)
      edges.position.copy(container.position)
      scene.add(edges)

      // Floor grid
      const gridHelper = new THREE.GridHelper(Math.max(cL, cW) * 1.5, 20, 0xcccccc, 0xe5e5e5)
      scene.add(gridHelper)

      // Pack items
      let x = -cL / 2 + 10
      let y = 0
      let z = -cW / 2 + 10
      let rowH = 0
      let layerZ = 0

      const flatItems: Item[] = []
      items.forEach(item => {
        for (let q = 0; q < Math.min(item.quantity, 3); q++) {
          flatItems.push(item)
        }
      })

      // Animate items appearing one by one
      flatItems.forEach((item, idx) => {
        const iL = item.length_cm * SCALE
        const iW = item.width_cm * SCALE
        const iH = item.height_cm * SCALE

        // Simple row packing
        if (x + iL > cL / 2 - 10) {
          x = -cL / 2 + 10
          z += rowH + 5
          rowH = 0
        }
        if (z + iW > cW / 2 - 10) {
          z = -cW / 2 + 10
          y += 50
          rowH = 0
          x = -cL / 2 + 10
        }

        const geo = new THREE.BoxGeometry(iL, iH, iW)
        const color = new THREE.Color(ITEM_COLORS[idx % ITEM_COLORS.length])
        const mat = new THREE.MeshPhongMaterial({
          color,
          transparent: true,
          opacity: 0,
        })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.set(x + iL / 2, y + iH / 2, z + iW / 2)
        mesh.castShadow = true
        scene.add(mesh)

        // Animate in with delay
        setTimeout(() => {
          let opacity = 0
          const animate = () => {
            opacity = Math.min(opacity + 0.05, 0.85)
            mat.opacity = opacity
            if (opacity < 0.85) requestAnimationFrame(animate)
          }
          animate()
        }, idx * 150)

        x += iL + 3
        rowH = Math.max(rowH, iW)
      })

      sceneRef.current = { scene, camera, renderer, controls }

      // Fill % label
      const capacity = containerType === 'lcl' ? totalVolume * 1.1 : (containerType === '20ft' ? 33.2 : 67.7)
      const fillPct = Math.min((totalVolume / capacity) * 100, 100)

      function animate() {
        animationId = requestAnimationFrame(animate)
        controls.update()
        renderer.render(scene, camera)
      }
      animate()

      // Resize handler
      const handleResize = () => {
        if (!mountRef.current) return
        const w = mountRef.current.clientWidth
        camera.aspect = w / height
        camera.updateProjectionMatrix()
        renderer.setSize(w, height)
      }
      window.addEventListener('resize', handleResize)
    }

    init()

    return () => {
      cancelAnimationFrame(animationId)
      if (mountRef.current && sceneRef.current) {
        mountRef.current.innerHTML = ''
      }
    }
  }, [containerType, items, totalVolume])

  const capacity = containerType === '20ft' ? 33.2 : containerType === '40ft' ? 67.7 : totalVolume
  const fillPct = Math.min(Math.round((totalVolume / capacity) * 100), 100)

  return (
    <div className="space-y-4">
      <div ref={mountRef} className="w-full h-96 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing" />
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Container Fill</span>
          <span className={`text-sm font-bold ${fillPct > 90 ? 'text-red-600' : fillPct > 70 ? 'text-yellow-600' : 'text-green-600'}`}>
            {fillPct}%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-1000 ${fillPct > 90 ? 'bg-red-500' : fillPct > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{totalVolume.toFixed(2)} m³ used</span>
          {containerType !== 'lcl' && <span>{capacity} m³ total</span>}
        </div>
      </div>
      <p className="text-xs text-gray-400 text-center">Drag to rotate · Scroll to zoom</p>
    </div>
  )
}
