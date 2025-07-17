import React from 'react'

interface MazeHUDProps {
  elapsedTime: number
  checkpointsCollected: number
  totalCheckpoints: number
}

export function MazeHUD({ elapsedTime, checkpointsCollected, totalCheckpoints }: MazeHUDProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }
  
  return (
    <div className="absolute top-0 left-0 right-0 z-10 p-6">
      <div className="flex justify-between items-start">
        {/* Timer */}
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-amber-600/30">
          <div className="text-amber-400 text-sm font-medium mb-1">TIME</div>
          <div className="text-white text-2xl font-mono font-bold">
            {formatTime(elapsedTime)}
          </div>
        </div>
        
        {/* Checkpoints */}
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-amber-600/30">
          <div className="text-amber-400 text-sm font-medium mb-1">CHECKPOINTS</div>
          <div className="text-white text-2xl font-bold">
            {checkpointsCollected}/{totalCheckpoints}
          </div>
        </div>
      </div>
      
      {/* Controls hint */}
      <div className="absolute bottom-6 left-6">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 border border-amber-600/30">
          <div className="text-amber-400 text-sm font-medium mb-2">CONTROLS</div>
          <div className="text-white text-sm space-y-1">
            <div>WASD / Arrow Keys - Move</div>
            <div>Mouse - Look around</div>
            <div>Click - Lock cursor</div>
          </div>
        </div>
      </div>
      
      {/* Objective */}
      <div className="absolute bottom-6 right-6">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 border border-amber-600/30">
          <div className="text-amber-400 text-sm font-medium mb-2">OBJECTIVE</div>
          <div className="text-white text-sm space-y-1">
            <div>🟡 Collect checkpoints</div>
            <div>🟢 Reach the green goal</div>
          </div>
        </div>
      </div>
    </div>
  )
}