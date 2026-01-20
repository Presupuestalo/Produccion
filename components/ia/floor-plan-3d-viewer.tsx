"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, Grid, PerspectiveCamera } from "@react-three/drei"
import { Suspense } from "react"

interface Room3D {
  id: string
  type: string
  dimensions: { width: number; length: number; height: number }
  position: { x: number; y: number; z: number }
  walls: Array<{ start: { x: number; y: number }; end: { x: number; y: number } }>
  doors: Array<{ position: { x: number; y: number }; width: number }>
  windows: Array<{ position: { x: number; y: number }; width: number; height: number }>
}

interface FloorPlan3DViewerProps {
  rooms: Room3D[]
}

function Room({ room }: { room: Room3D }) {
  const { dimensions, position } = room
  const wallHeight = dimensions.height || 2.7
  const wallThickness = 0.15

  return (
    <group position={[position.x, 0, position.z]}>
      {/* Floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[dimensions.width, dimensions.length]} />
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>

      {/* Walls */}
      {room.walls.map((wall, index) => {
        const x1 = wall.start.x
        const z1 = wall.start.y
        const x2 = wall.end.x
        const z2 = wall.end.y
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2))
        const angle = Math.atan2(z2 - z1, x2 - x1)
        const centerX = (x1 + x2) / 2
        const centerZ = (z1 + z2) / 2

        return (
          <mesh key={index} position={[centerX, wallHeight / 2, centerZ]} rotation={[0, angle, 0]}>
            <boxGeometry args={[length, wallHeight, wallThickness]} />
            <meshStandardMaterial color="#f3f4f6" />
          </mesh>
        )
      })}

      {/* Doors */}
      {room.doors.map((door, index) => {
        const x = door.position.x
        const z = door.position.y
        return (
          <mesh key={`door-${index}`} position={[x, 1, z]}>
            <boxGeometry args={[door.width, 2, 0.05]} />
            <meshStandardMaterial color="#8b5cf6" />
          </mesh>
        )
      })}

      {/* Windows */}
      {room.windows.map((window, index) => {
        const x = window.position.x
        const z = window.position.y
        return (
          <mesh key={`window-${index}`} position={[x, 1.5, z]}>
            <boxGeometry args={[window.width, window.height, 0.05]} />
            <meshStandardMaterial color="#60a5fa" transparent opacity={0.6} />
          </mesh>
        )
      })}
    </group>
  )
}

export default function FloorPlan3DViewer({ rooms }: FloorPlan3DViewerProps) {
  return (
    <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={50} />
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <pointLight position={[-10, 10, -10]} intensity={0.5} />

          {rooms.map((room) => (
            <Room key={room.id} room={room} />
          ))}

          <Grid
            args={[50, 50]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#6b7280"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#9ca3af"
            fadeDistance={30}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid
          />

          <Environment preset="apartment" />
          <OrbitControls makeDefault enableDamping dampingFactor={0.05} minDistance={5} maxDistance={50} />
        </Suspense>
      </Canvas>
    </div>
  )
}
