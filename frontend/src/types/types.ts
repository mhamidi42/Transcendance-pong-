// ============================================
// 1. TYPES ET INTERFACES (types.ts)
// ============================================

export interface PongSettings {
    difficulty: 'none' | 'easy' | 'medium' | 'hard';
    ballSpeed: number;
    paddleSpeed: number;
    backgroundColor: string;
    ballColor: string;
    paddleColor: string;
    player1Up: string;
    player1Down: string;
    player2Up: string;
    player2Down: string;
    maxScore: number;
    powerUp: boolean;
}

export interface GameStats {
    gamesPlayed: number;
    wins: number;
    losses: number;
    bestScore: number;
    totalPlayTime: number; // en secondes
    currentWinStreak?: number;
    bestWinStreak?: number;
}

export interface MatchRecord {
    id: number;
    playerScore: number;
    opponentScore: number;
    result: 'win' | 'loss';
    opponentType: 'ai' | 'human';
    playedAt: string; // ISO date string
    duration: number; // en secondes
}