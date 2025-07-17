import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import * as THREE from 'three'
import { MazeHUD } from './MazeHUD'
import { VictoryScreen } from './VictoryScreen'

// Maze configuration - smaller size for better performance
const MAZE_SIZE = 9
const WALL_HEIGHT = 2.5
const WALL_THICKNESS = 0.2

// Simple maze generation
function generateMaze(size: number): number[][] {
  const maze = Array(size).fill(null).map(() => Array(size).fill(1))
  
  function carve(x: number, y: number) {
    maze[y][x] = 0
    
    const directions = [
      [0, -2], [2, 0], [0, 2], [-2, 0]
    ].sort(() => Math.random() - 0.5)
    
    for (const [dx, dy] of directions) {
      const nx = x + dx
      const ny = y + dy
      
      if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && maze[ny][nx] === 1) {
        maze[y + dy / 2][x + dx / 2] = 0
        carve(nx, ny)
      }
    }
  }
  
  carve(1, 1)
  maze[1][1] = 0 // Start
  maze[size - 2][size - 2] = 0 // End
  
  return maze
}

interface MazeWallsProps {
  maze: number[][]
  onCheckpoint: (position: THREE.Vector3) => void
}

function MazeWalls({ maze, onCheckpoint }: MazeWallsProps) {
  // Create materials once and reuse
  const stoneMaterial = new THREE.MeshLambertMaterial({ 
    color: '#8B7355'
  })
  const floorMaterial = new THREE.MeshLambertMaterial({ 
    color: '#4A4A4A' 
  })
  const checkpointMaterial = new THREE.MeshBasicMaterial({ 
    color: '#FFD700',
    emissive: '#FFD700',
    emissiveIntensity: 0.2
  })
  const goalMaterial = new THREE.MeshBasicMaterial({ 
    color: '#00FF00',
    emissive: '#00FF00',
    emissiveIntensity: 0.3
  })
  
  const walls = []
  const checkpoints = []
  
  // Generate fewer checkpoints
  const checkpointPositions = [
    { x: 3, z: 3 },
    { x: 5, z: 5 }
  ]
  
  for (let z = 0; z < maze.length; z++) {
    for (let x = 0; x < maze[z].length; x++) {
      if (maze[z][x] === 1) {
        walls.push(
          <mesh 
            key={`wall-${x}-${z}`} 
            position={[x - MAZE_SIZE/2, WALL_HEIGHT/2, z - MAZE_SIZE/2]} 
            material={stoneMaterial}
          >
            <boxGeometry args={[1, WALL_HEIGHT, 1]} />
          </mesh>
        )
      } else {
        // Add checkpoints
        const checkpoint = checkpointPositions.find(cp => cp.x === x && cp.z === z)
        if (checkpoint) {
          checkpoints.push(
            <mesh 
              key={`checkpoint-${x}-${z}`} 
              position={[x - MAZE_SIZE/2, 0.5, z - MAZE_SIZE/2]}
              material={checkpointMaterial}
              onClick={() => onCheckpoint(new THREE.Vector3(x - MAZE_SIZE/2, 0, z - MAZE_SIZE/2))}
            >
              <cylinderGeometry args={[0.3, 0.3, 1]} />
            </mesh>
          )
        }
      }
    }
  }
  
  return (
    <group>
      {walls}
      {checkpoints}
      {/* Floor */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} material={floorMaterial}>
        <planeGeometry args={[MAZE_SIZE, MAZE_SIZE]} />
      </mesh>
      {/* Goal marker */}
      <mesh position={[MAZE_SIZE/2 - 2, 1, MAZE_SIZE/2 - 2]} material={goalMaterial}>
        <cylinderGeometry args={[0.5, 0.5, 2]} />
      </mesh>
    </group>
  )
}

interface PlayerControllerProps {
  maze: number[][]
  onPositionChange: (position: THREE.Vector3) => void
  onGoalReached: () => void
}

function PlayerController({ maze, onPositionChange, onGoalReached }: PlayerControllerProps) {
  const { camera } = useThree()
  const controlsRef = useRef<any>()
  const velocity = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())
  
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
  
  // Collision detection
  const checkCollision = (position: THREE.Vector3): boolean => {
    const x = Math.round(position.x + MAZE_SIZE/2)
    const z = Math.round(position.z + MAZE_SIZE/2)
    
    if (x < 0 || x >= MAZE_SIZE || z < 0 || z >= MAZE_SIZE) return true
    return maze[z] && maze[z][x] === 1
  }
  
  useFrame((state, delta) => {
    if (!controlsRef.current) return
    
    velocity.current.x -= velocity.current.x * 10.0 * delta
    velocity.current.z -= velocity.current.z * 10.0 * delta
    
    direction.current.z = Number(moveForward.current) - Number(moveBackward.current)
    direction.current.x = Number(moveRight.current) - Number(moveLeft.current)
    direction.current.normalize()
    
    if (moveForward.current || moveBackward.current) velocity.current.z -= direction.current.z * 400.0 * delta
    if (moveLeft.current || moveRight.current) velocity.current.x -= direction.current.x * 400.0 * delta
    
    const newPosition = camera.position.clone()
    newPosition.x += velocity.current.x * delta
    newPosition.z += velocity.current.z * delta
    
    // Check collision before moving
    if (!checkCollision(newPosition)) {
      camera.position.copy(newPosition)
      onPositionChange(camera.position)
      
      // Check if reached goal
      const goalX = MAZE_SIZE/2 - 2
      const goalZ = MAZE_SIZE/2 - 2
      const distance = Math.sqrt(
        Math.pow(camera.position.x - goalX, 2) + 
        Math.pow(camera.position.z - goalZ, 2)
      )
      
      if (distance < 1) {
        onGoalReached()
      }
    }
  })
  
  return (
    <PointerLockControls 
      ref={controlsRef}
      camera={camera}
    />
  )
}

function Scene({ 
  maze, 
  onPositionChange, 
  onGoalReached, 
  onCheckpoint 
}: {
  maze: number[][]
  onPositionChange: (position: THREE.Vector3) => void
  onGoalReached: () => void
  onCheckpoint: (position: THREE.Vector3) => void
}) {
  const { camera } = useThree()
  
  useEffect(() => {
    // Set initial camera position
    camera.position.set(-MAZE_SIZE/2 + 1, 1.6, -MAZE_SIZE/2 + 1)
  }, [camera])
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={0.6}
      />
      
      {/* Fog for atmosphere */}
      <fog attach="fog" args={['#1A1A1A', 3, 15]} />
      
      <MazeWalls maze={maze} onCheckpoint={onCheckpoint} />
      <PlayerController 
        maze={maze} 
        onPositionChange={onPositionChange}
        onGoalReached={onGoalReached}
      />
    </>
  )
}

export function MazeGame() {
  const [maze] = useState(() => generateMaze(MAZE_SIZE))
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [checkpoints, setCheckpoints] = useState<THREE.Vector3[]>([])
  const [playerPosition, setPlayerPosition] = useState<THREE.Vector3>(new THREE.Vector3())
  
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
  
  const handleCheckpoint = useCallback((position: THREE.Vector3) => {
    setCheckpoints(prev => [...prev, position])
  }, [])
  
  const resetGame = () => {
    setGameStarted(false)
    setGameCompleted(false)
    setCheckpoints([])
    setStartTime(0)
    setCurrentTime(0)
  }
  
  const elapsedTime = gameStarted ? (currentTime - startTime) / 1000 : 0
  
  if (!gameStarted) {
    return (
      <div className="h-screen w-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-4">Maze Runner 3D</h1>
          <p className="text-xl text-gray-300 mb-8">Navigate the stone maze in first person</p>
          <div className="text-gray-400 mb-8 space-y-2">
            <p>Use WASD or Arrow Keys to move</p>
            <p>Click to lock mouse cursor</p>
            <p>Collect checkpoints and reach the green goal</p>
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
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 1000 }}
        gl={{ antialias: false, powerPreference: "low-power" }}
      >
        <Scene 
          maze={maze}
          onPositionChange={setPlayerPosition}
          onGoalReached={handleGoalReached}
          onCheckpoint={handleCheckpoint}
        />
      </Canvas>
      
      <MazeHUD 
        elapsedTime={elapsedTime}
        checkpointsCollected={checkpoints.length}
        totalCheckpoints={2}
      />
      
      {gameCompleted && (
        <VictoryScreen 
          completionTime={elapsedTime}
          checkpointsCollected={checkpoints.length}
          onRestart={resetGame}
        />
      )}
    </div>
  )
}