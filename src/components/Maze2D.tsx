import React, { useState, useEffect, useCallback } from 'react'

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

const CELL_SIZE = 40
const PLAYER_SIZE = 20

// Checkpoint positions
const CHECKPOINT_POSITIONS = [
  { x: 3, y: 3 },
  { x: 7, y: 5 },
  { x: 5, y: 7 }
]

interface Position {
  x: number
  y: number
}

export function Maze2D() {
  const [playerPos, setPlayerPos] = useState<Position>({ x: 1, y: 1 })
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [checkpoints, setCheckpoints] = useState<Position[]>([])
  

  
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
    setPlayerPos({ x: 1, y: 1 })
    setCheckpoints([])
  }
  
  const resetGame = () => {
    setGameStarted(false)
    setGameCompleted(false)
    setStartTime(0)
    setCurrentTime(0)
    setPlayerPos({ x: 1, y: 1 })
    setCheckpoints([])
  }
  
  const movePlayer = useCallback((dx: number, dy: number) => {
    if (!gameStarted || gameCompleted) return
    
    setPlayerPos(prev => {
      const newX = prev.x + dx
      const newY = prev.y + dy
      
      // Check bounds and walls
      if (newX < 0 || newX >= MAZE_LAYOUT[0].length || 
          newY < 0 || newY >= MAZE_LAYOUT.length ||
          MAZE_LAYOUT[newY][newX] === 1) {
        return prev
      }
      
      const newPos = { x: newX, y: newY }
      
      // Check for checkpoint collection
      const checkpoint = CHECKPOINT_POSITIONS.find(cp => cp.x === newX && cp.y === newY)
      if (checkpoint && !checkpoints.some(c => c.x === newX && c.y === newY)) {
        setCheckpoints(prev => [...prev, newPos])
      }
      
      // Check for goal
      if (MAZE_LAYOUT[newY][newX] === 2) {
        setGameCompleted(true)
      }
      
      return newPos
    })
  }, [gameStarted, gameCompleted, checkpoints])
  
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          movePlayer(0, -1)
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          movePlayer(0, 1)
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          movePlayer(-1, 0)
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          movePlayer(1, 0)
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [movePlayer])
  
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
          <h1 className="text-6xl font-bold text-white mb-4">Maze Runner</h1>
          <p className="text-xl text-gray-300 mb-8">Navigate the maze from above</p>
          <div className="text-gray-400 mb-8 space-y-2">
            <p>Use WASD or Arrow Keys to move</p>
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
    <div className="h-screen w-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      {/* HUD */}
      <div className="flex justify-between items-center w-full max-w-2xl mb-4">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-amber-600/30">
          <div className="text-amber-400 text-sm font-medium mb-1">TIME</div>
          <div className="text-white text-xl font-mono font-bold">
            {formatTime(elapsedTime)}
          </div>
        </div>
        
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-amber-600/30">
          <div className="text-amber-400 text-sm font-medium mb-1">CHECKPOINTS</div>
          <div className="text-white text-xl font-bold">
            {checkpoints.length}/{CHECKPOINT_POSITIONS.length}
          </div>
        </div>
      </div>
      
      {/* Maze */}
      <div className="relative bg-black border-2 border-amber-600/50 rounded-lg p-2">
        <svg 
          width={MAZE_LAYOUT[0].length * CELL_SIZE} 
          height={MAZE_LAYOUT.length * CELL_SIZE}
          className="block"
        >
          {/* Render maze */}
          {MAZE_LAYOUT.map((row, y) =>
            row.map((cell, x) => (
              <rect
                key={`${x}-${y}`}
                x={x * CELL_SIZE}
                y={y * CELL_SIZE}
                width={CELL_SIZE}
                height={CELL_SIZE}
                fill={
                  cell === 1 ? '#8B7355' : // Wall
                  cell === 2 ? '#00FF00' : // Goal
                  '#2A2A2A' // Floor
                }
                stroke="#1A1A1A"
                strokeWidth={1}
              />
            ))
          )}
          
          {/* Render checkpoints */}
          {CHECKPOINT_POSITIONS.map((checkpoint, i) => (
            <circle
              key={`checkpoint-${i}`}
              cx={checkpoint.x * CELL_SIZE + CELL_SIZE / 2}
              cy={checkpoint.y * CELL_SIZE + CELL_SIZE / 2}
              r={8}
              fill={checkpoints.some(c => c.x === checkpoint.x && c.y === checkpoint.y) ? '#666' : '#FFD700'}
              stroke="#FFA500"
              strokeWidth={2}
            />
          ))}
          
          {/* Player */}
          <circle
            cx={playerPos.x * CELL_SIZE + CELL_SIZE / 2}
            cy={playerPos.y * CELL_SIZE + CELL_SIZE / 2}
            r={PLAYER_SIZE / 2}
            fill="#4F46E5"
            stroke="#6366F1"
            strokeWidth={2}
          />
        </svg>
      </div>
      
      {/* Controls */}
      <div className="mt-4 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 border border-amber-600/30">
        <div className="text-amber-400 text-sm font-medium mb-2">CONTROLS</div>
        <div className="text-white text-sm text-center">
          WASD or Arrow Keys to move
        </div>
      </div>
      
      {/* Victory Screen */}
      {gameCompleted && (
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
                  {checkpoints.length}/{CHECKPOINT_POSITIONS.length}
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