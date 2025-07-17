import React, { useRef, useEffect, useState, useCallback } from 'react'

// Maze configuration
const MAZE_SIZE = 11
const CELL_SIZE = 1
const WALL_HEIGHT = 2
const PLAYER_HEIGHT = 1.6
const MOVE_SPEED = 3
const TURN_SPEED = 2

// Simple maze layout
const MAZE_LAYOUT = [
  [1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,1,0,0,0,0,0,1],
  [1,0,1,0,1,0,1,1,1,0,1],
  [1,0,1,0,0,0,1,0,0,0,1],
  [1,0,1,1,1,1,1,0,1,1,1],
  [1,0,0,0,0,0,0,0,1,0,1],
  [1,1,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,1,0,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,2,1],
  [1,1,1,1,1,1,1,1,1,1,1]
]

// Checkpoint positions
const CHECKPOINTS = [
  { x: 3, y: 3 },
  { x: 7, y: 5 },
  { x: 5, y: 7 }
]

interface Player {
  x: number
  y: number
  angle: number
}

interface GameState {
  player: Player
  checkpoints: { x: number, y: number }[]
  gameStarted: boolean
  gameCompleted: boolean
  startTime: number
  currentTime: number
}

export function SimpleMaze3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  
  const [gameState, setGameState] = useState<GameState>({
    player: { x: 1.5, y: 1.5, angle: 0 },
    checkpoints: [],
    gameStarted: false,
    gameCompleted: false,
    startTime: 0,
    currentTime: 0
  })
  
  const keysRef = useRef({
    w: false,
    s: false,
    a: false,
    d: false,
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
  })
  
  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (gameState.gameStarted && !gameState.gameCompleted) {
      interval = setInterval(() => {
        setGameState(prev => ({ ...prev, currentTime: Date.now() }))
      }, 100)
    }
    return () => clearInterval(interval)
  }, [gameState.gameStarted, gameState.gameCompleted])
  
  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key in keysRef.current) {
        keysRef.current[e.key as keyof typeof keysRef.current] = true
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key in keysRef.current) {
        keysRef.current[e.key as keyof typeof keysRef.current] = false
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])
  
  const drawHUD = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const elapsedTime = gameState.gameStarted ? (gameState.currentTime - gameState.startTime) / 1000 : 0
    
    // Timer
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(20, 20, 200, 80)
    ctx.strokeStyle = '#D97706'
    ctx.strokeRect(20, 20, 200, 80)
    
    ctx.fillStyle = '#D97706'
    ctx.font = '14px Inter'
    ctx.fillText('TIME', 30, 40)
    
    ctx.fillStyle = 'white'
    ctx.font = 'bold 24px monospace'
    const mins = Math.floor(elapsedTime / 60)
    const secs = Math.floor(elapsedTime % 60)
    const ms = Math.floor((elapsedTime % 1) * 100)
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
    ctx.fillText(timeStr, 30, 70)
    
    // Checkpoints
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(width - 220, 20, 200, 80)
    ctx.strokeStyle = '#D97706'
    ctx.strokeRect(width - 220, 20, 200, 80)
    
    ctx.fillStyle = '#D97706'
    ctx.font = '14px Inter'
    ctx.fillText('CHECKPOINTS', width - 210, 40)
    
    ctx.fillStyle = 'white'
    ctx.font = 'bold 24px Inter'
    ctx.fillText(`${gameState.checkpoints.length}/${CHECKPOINTS.length}`, width - 210, 70)
    
    // Controls
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(20, height - 120, 250, 100)
    ctx.strokeStyle = '#D97706'
    ctx.strokeRect(20, height - 120, 250, 100)
    
    ctx.fillStyle = '#D97706'
    ctx.font = '14px Inter'
    ctx.fillText('CONTROLS', 30, height - 100)
    
    ctx.fillStyle = 'white'
    ctx.font = '12px Inter'
    ctx.fillText('WASD / Arrow Keys - Move', 30, height - 80)
    ctx.fillText('Mouse - Look around', 30, height - 60)
    ctx.fillText('🟡 Collect checkpoints', 30, height - 40)
    ctx.fillText('🟢 Reach the goal', 30, height - 20)
  }, [gameState])

  // Raycasting renderer
  const render = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear canvas
    ctx.fillStyle = '#1A1A1A'
    ctx.fillRect(0, 0, width, height)
    
    // Draw ceiling
    ctx.fillStyle = '#2A2A2A'
    ctx.fillRect(0, 0, width, height / 2)
    
    // Draw floor
    ctx.fillStyle = '#4A4A4A'
    ctx.fillRect(0, height / 2, width, height / 2)
    
    const { player } = gameState
    const rayCount = width / 2 // Reduce ray count for performance
    
    for (let i = 0; i < rayCount; i++) {
      const rayAngle = player.angle - Math.PI / 6 + (i / rayCount) * (Math.PI / 3)
      
      // Cast ray
      let distance = 0
      let hit = false
      const stepSize = 0.02
      
      while (!hit && distance < 20) {
        const rayX = player.x + Math.cos(rayAngle) * distance
        const rayY = player.y + Math.sin(rayAngle) * distance
        
        const mapX = Math.floor(rayX)
        const mapY = Math.floor(rayY)
        
        if (mapX < 0 || mapX >= MAZE_SIZE || mapY < 0 || mapY >= MAZE_SIZE || 
            MAZE_LAYOUT[mapY][mapX] === 1) {
          hit = true
        } else {
          distance += stepSize
        }
      }
      
      // Calculate wall height
      const correctedDistance = distance * Math.cos(rayAngle - player.angle)
      const wallHeight = (WALL_HEIGHT / correctedDistance) * (height / 4)
      
      // Draw wall slice
      const wallTop = (height / 2) - (wallHeight / 2)
      const wallBottom = (height / 2) + (wallHeight / 2)
      
      // Wall color based on distance (fog effect)
      const brightness = Math.max(0.2, 1 - distance / 10)
      const wallColor = `rgb(${Math.floor(139 * brightness)}, ${Math.floor(115 * brightness)}, ${Math.floor(85 * brightness)})`
      
      ctx.fillStyle = wallColor
      ctx.fillRect(i * 2, wallTop, 2, wallBottom - wallTop)
    }
    
    // Draw HUD
    drawHUD(ctx, width, height)
  }, [gameState, drawHUD])
  
  // Game loop
  const gameLoop = useCallback(() => {
    if (!gameState.gameStarted || gameState.gameCompleted) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Update player position
    setGameState(prev => {
      const newPlayer = { ...prev.player }
      const keys = keysRef.current
      
      // Movement
      let moveX = 0
      let moveY = 0
      
      if (keys.w || keys.ArrowUp) {
        moveX += Math.cos(newPlayer.angle) * MOVE_SPEED * 0.016
        moveY += Math.sin(newPlayer.angle) * MOVE_SPEED * 0.016
      }
      if (keys.s || keys.ArrowDown) {
        moveX -= Math.cos(newPlayer.angle) * MOVE_SPEED * 0.016
        moveY -= Math.sin(newPlayer.angle) * MOVE_SPEED * 0.016
      }
      if (keys.a) {
        newPlayer.angle -= TURN_SPEED * 0.016
      }
      if (keys.d) {
        newPlayer.angle += TURN_SPEED * 0.016
      }
      if (keys.ArrowLeft) {
        newPlayer.angle -= TURN_SPEED * 0.016
      }
      if (keys.ArrowRight) {
        newPlayer.angle += TURN_SPEED * 0.016
      }
      
      // Collision detection
      const newX = newPlayer.x + moveX
      const newY = newPlayer.y + moveY
      
      const mapX = Math.floor(newX)
      const mapY = Math.floor(newY)
      
      if (mapX >= 0 && mapX < MAZE_SIZE && mapY >= 0 && mapY < MAZE_SIZE && 
          MAZE_LAYOUT[mapY][mapX] !== 1) {
        newPlayer.x = newX
        newPlayer.y = newY
        
        // Check for checkpoint collection
        const checkpoint = CHECKPOINTS.find(cp => 
          Math.abs(cp.x - newX) < 0.5 && Math.abs(cp.y - newY) < 0.5 &&
          !prev.checkpoints.some(c => c.x === cp.x && c.y === cp.y)
        )
        
        if (checkpoint) {
          return {
            ...prev,
            player: newPlayer,
            checkpoints: [...prev.checkpoints, checkpoint]
          }
        }
        
        // Check for goal
        if (MAZE_LAYOUT[mapY][mapX] === 2) {
          return {
            ...prev,
            player: newPlayer,
            gameCompleted: true
          }
        }
      }
      
      return { ...prev, player: newPlayer }
    })
    
    // Render
    render(ctx, canvas.width, canvas.height)
  }, [gameState.gameStarted, gameState.gameCompleted, render])
  
  // Animation loop
  useEffect(() => {
    const animate = () => {
      gameLoop()
      animationRef.current = requestAnimationFrame(animate)
    }
    
    if (gameState.gameStarted) {
      animate()
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameLoop, gameState.gameStarted])
  
  // Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])
  
  const startGame = () => {
    setGameState(prev => ({
      ...prev,
      gameStarted: true,
      startTime: Date.now(),
      currentTime: Date.now(),
      player: { x: 1.5, y: 1.5, angle: 0 },
      checkpoints: []
    }))
  }
  
  const resetGame = () => {
    setGameState({
      player: { x: 1.5, y: 1.5, angle: 0 },
      checkpoints: [],
      gameStarted: false,
      gameCompleted: false,
      startTime: 0,
      currentTime: 0
    })
  }
  
  const elapsedTime = gameState.gameStarted ? (gameState.currentTime - gameState.startTime) / 1000 : 0
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }
  
  if (!gameState.gameStarted) {
    return (
      <div className="h-screen w-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-4">Maze Runner 3D</h1>
          <p className="text-xl text-gray-300 mb-8">Navigate the stone maze in first person</p>
          <div className="text-gray-400 mb-8 space-y-2">
            <p>Use WASD or Arrow Keys to move and turn</p>
            <p>🟡 Collect yellow checkpoints</p>
            <p>🟢 Reach the green goal</p>
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
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="block cursor-crosshair"
        style={{ background: '#1A1A1A' }}
      />
      
      {gameState.gameCompleted && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-gradient-to-b from-gray-900 to-black border border-amber-600/50 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-4xl font-bold text-white mb-4">MAZE CONQUERED!</h2>
            
            <div className="space-y-4 mb-6">
              <div className="bg-black/50 rounded-lg p-4">
                <div className="text-amber-400 text-sm font-medium mb-1">COMPLETION TIME</div>
                <div className="text-white text-3xl font-mono font-bold">
                  {formatTime(elapsedTime)}
                </div>
              </div>
              
              <div className="bg-black/50 rounded-lg p-4">
                <div className="text-amber-400 text-sm font-medium mb-1">CHECKPOINTS</div>
                <div className="text-white text-3xl font-bold">
                  {gameState.checkpoints.length}/{CHECKPOINTS.length}
                </div>
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