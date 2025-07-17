import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import * as THREE from 'three'

// Simple maze layout
const MAZE_LAYOUT = [
  [1,1,1,1,1,1,1,1,1],
  [1,0,0,0,1,0,0,0,1],
  [1,0,1,0,1,0,1,0,1],
  [1,0,1,0,0,0,1,0,1],
  [1,0,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,1],
  [1,0,1,0,1,0,1,1,1],
  [1,0,0,0,1,0,0,2,1],
  [1,1,1,1,1,1,1,1,1]
]

const MAZE_SIZE = MAZE_LAYOUT.length
const WALL_HEIGHT = 3

interface MazeWallsProps {
  onGoalReached: () => void
}

function MazeWalls({ onGoalReached }: MazeWallsProps) {
  const walls = []
  
  for (let z = 0; z < MAZE_SIZE; z++) {
    for (let x = 0; x < MAZE_SIZE; x++) {
      if (MAZE_LAYOUT[z][x] === 1) {
        walls.push(
          <mesh key={`wall-${x}-${z}`} position={[x - MAZE_SIZE/2, WALL_HEIGHT/2, z - MAZE_SIZE/2]}>
            <boxGeometry args={[1, WALL_HEIGHT, 1]} />
            <meshLambertMaterial color="#8B7355" />
          </mesh>
        )
      } else if (MAZE_LAYOUT[z][x] === 2) {
        // Goal
        walls.push(
          <mesh key={`goal-${x}-${z}`} position={[x - MAZE_SIZE/2, 1, z - MAZE_SIZE/2]}>
            <cylinderGeometry args={[0.5, 0.5, 2]} />
            <meshBasicMaterial color="#00FF00" />
          </mesh>
        )
      }
    }
  }
  
  return (
    <group>
      {walls}
      {/* Floor */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[MAZE_SIZE, MAZE_SIZE]} />
        <meshLambertMaterial color="#4A4A4A" />
      </mesh>
    </group>
  )
}

function PlayerController({ onGoalReached }: { onGoalReached: () => void }) {
  const { camera } = useThree()
  const controlsRef = useRef<any>()
  const velocity = useRef(new THREE.Vector3())
  
  const moveForward = useRef(false)
  const moveBackward = useRef(false)
  const moveLeft = useRef(false)
  const moveRight = useRef(false)
  
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          moveForward.current = true
          break
        case 'ArrowLeft':
        case 'KeyA':
          moveLeft.current = true
          break
        case 'ArrowDown':
        case 'KeyS':
          moveBackward.current = true
          break
        case 'ArrowRight':
        case 'KeyD':
          moveRight.current = true
          break
      }
    }
    
    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          moveForward.current = false
          break
        case 'ArrowLeft':
        case 'KeyA':
          moveLeft.current = false
          break
        case 'ArrowDown':
        case 'KeyS':
          moveBackward.current = false
          break
        case 'ArrowRight':
        case 'KeyD':
          moveRight.current = false
          break
      }
    }
    
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
    }
  }, [])
  
  const checkCollision = (position: THREE.Vector3): boolean => {
    const x = Math.round(position.x + MAZE_SIZE/2)
    const z = Math.round(position.z + MAZE_SIZE/2)
    
    if (x < 0 || x >= MAZE_SIZE || z < 0 || z >= MAZE_SIZE) return true
    return MAZE_LAYOUT[z] && MAZE_LAYOUT[z][x] === 1
  }
  
  useFrame((state, delta) => {
    if (!controlsRef.current) return
    
    velocity.current.x -= velocity.current.x * 10.0 * delta
    velocity.current.z -= velocity.current.z * 10.0 * delta
    
    const direction = new THREE.Vector3()
    direction.z = Number(moveForward.current) - Number(moveBackward.current)
    direction.x = Number(moveRight.current) - Number(moveLeft.current)
    direction.normalize()
    
    if (moveForward.current || moveBackward.current) velocity.current.z -= direction.z * 400.0 * delta
    if (moveLeft.current || moveRight.current) velocity.current.x -= direction.x * 400.0 * delta
    
    const newPosition = camera.position.clone()
    newPosition.x += velocity.current.x * delta
    newPosition.z += velocity.current.z * delta
    
    if (!checkCollision(newPosition)) {
      camera.position.copy(newPosition)
      
      // Check if reached goal
      const goalX = 3.5 - MAZE_SIZE/2
      const goalZ = 3.5 - MAZE_SIZE/2
      const distance = Math.sqrt(
        Math.pow(camera.position.x - goalX, 2) + 
        Math.pow(camera.position.z - goalZ, 2)
      )
      
      if (distance < 1) {
        onGoalReached()
      }
    }
  })
  
  return <PointerLockControls ref={controlsRef} />
}

function Scene({ onGoalReached }: { onGoalReached: () => void }) {
  const { camera } = useThree()
  
  useEffect(() => {
    camera.position.set(-MAZE_SIZE/2 + 1, 1.6, -MAZE_SIZE/2 + 1)
  }, [camera])
  
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <fog attach="fog" args={['#1A1A1A', 5, 15]} />
      
      <MazeWalls onGoalReached={onGoalReached} />
      <PlayerController onGoalReached={onGoalReached} />
    </>
  )
}

export function SimpleMazeGame() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  const [currentTime, setCurrentTime] = useState<number>(0)
  
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (gameStarted && !gameCompleted) {
      interval = setInterval(() => {
        setCurrentTime(Date.now())
      }, 100)
    }
    return () => clearInterval(interval)
  }, [gameStarted, gameCompleted])
  
  const startGame = () => {
    setGameStarted(true)
    setStartTime(Date.now())
    setCurrentTime(Date.now())
  }
  
  const handleGoalReached = useCallback(() => {
    setGameCompleted(true)
  }, [])
  
  const resetGame = () => {
    setGameStarted(false)
    setGameCompleted(false)
    setStartTime(0)
    setCurrentTime(0)
  }
  
  const elapsedTime = gameStarted ? (currentTime - startTime) / 1000 : 0
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }
  
  if (!gameStarted) {
    return (
      <div className="h-screen w-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-4">Maze Runner 3D</h1>
          <p className="text-xl text-gray-300 mb-8">Navigate the stone maze in first person</p>
          <div className="text-gray-400 mb-8 space-y-2">
            <p>Use WASD or Arrow Keys to move</p>
            <p>Click to lock mouse cursor</p>
            <p>Reach the green goal cylinder</p>
          </div>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white text-xl font-semibold rounded-lg transition-colors"
          >
            Start Game
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-screen w-screen relative">
      <Canvas camera={{ fov: 75, near: 0.1, far: 1000 }}>
        <Scene onGoalReached={handleGoalReached} />
      </Canvas>
      
      {/* Simple HUD */}
      <div className="absolute top-6 left-6 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-amber-600/30">
        <div className="text-amber-400 text-sm font-medium mb-1">TIME</div>
        <div className="text-white text-2xl font-mono font-bold">
          {formatTime(elapsedTime)}
        </div>
      </div>
      
      <div className="absolute bottom-6 left-6 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 border border-amber-600/30">
        <div className="text-amber-400 text-sm font-medium mb-2">CONTROLS</div>
        <div className="text-white text-sm space-y-1">
          <div>WASD / Arrow Keys - Move</div>
          <div>Mouse - Look around</div>
        </div>
      </div>
      
      {gameCompleted && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-gradient-to-b from-gray-900 to-black border border-amber-600/50 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-4xl font-bold text-white mb-4">MAZE CONQUERED!</h2>
            
            <div className="bg-black/50 rounded-lg p-4 mb-6">
              <div className="text-amber-400 text-sm font-medium mb-1">COMPLETION TIME</div>
              <div className="text-white text-3xl font-mono font-bold">
                {formatTime(elapsedTime)}
              </div>
            </div>
            
            <button
              onClick={resetGame}
              className="w-full px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}