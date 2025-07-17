import React from 'react'

interface VictoryScreenProps {
  completionTime: number
  checkpointsCollected: number
  onRestart: () => void
}

export function VictoryScreen({ completionTime, checkpointsCollected, onRestart }: VictoryScreenProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }
  
  const getPerformanceRating = (time: number, checkpoints: number): string => {
    if (checkpoints === 4 && time < 60) return 'LEGENDARY'
    if (checkpoints === 4 && time < 120) return 'EXCELLENT'
    if (checkpoints >= 3 && time < 180) return 'GREAT'
    if (checkpoints >= 2) return 'GOOD'
    return 'COMPLETED'
  }
  
  const rating = getPerformanceRating(completionTime, checkpointsCollected)
  
  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-gradient-to-b from-gray-900 to-black border border-amber-600/50 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
        {/* Victory Header */}
        <div className="mb-6">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-4xl font-bold text-white mb-2">MAZE CONQUERED!</h2>
          <div className={`text-2xl font-bold ${
            rating === 'LEGENDARY' ? 'text-purple-400' :
            rating === 'EXCELLENT' ? 'text-yellow-400' :
            rating === 'GREAT' ? 'text-green-400' :
            rating === 'GOOD' ? 'text-blue-400' :
            'text-gray-400'
          }`}>
            {rating}
          </div>
        </div>
        
        {/* Stats */}
        <div className="space-y-4 mb-8">
          <div className="bg-black/50 rounded-lg p-4">
            <div className="text-amber-400 text-sm font-medium mb-1">COMPLETION TIME</div>
            <div className="text-white text-3xl font-mono font-bold">
              {formatTime(completionTime)}
            </div>
          </div>
          
          <div className="bg-black/50 rounded-lg p-4">
            <div className="text-amber-400 text-sm font-medium mb-1">CHECKPOINTS COLLECTED</div>
            <div className="text-white text-3xl font-bold">
              {checkpointsCollected}/4
            </div>
          </div>
          
          {/* Performance breakdown */}
          <div className="bg-black/50 rounded-lg p-4">
            <div className="text-amber-400 text-sm font-medium mb-2">PERFORMANCE</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Speed Bonus:</span>
                <span className={completionTime < 120 ? 'text-green-400' : 'text-gray-400'}>
                  {completionTime < 120 ? '+50' : '0'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Checkpoint Bonus:</span>
                <span className="text-yellow-400">+{checkpointsCollected * 25}</span>
              </div>
              <div className="flex justify-between border-t border-gray-600 pt-2">
                <span className="text-white font-medium">Total Score:</span>
                <span className="text-amber-400 font-bold">
                  {1000 + (completionTime < 120 ? 50 : 0) + (checkpointsCollected * 25)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onRestart}
            className="w-full px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
          >
            Play Again
          </button>
          
          <div className="text-gray-400 text-sm">
            Challenge yourself to beat your time!
          </div>
        </div>
      </div>
    </div>
  )
}