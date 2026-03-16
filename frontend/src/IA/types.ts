// src/AI/types.ts

export type Difficulty = 'easy' | 'medium' | 'hard';

export type AIAction = 'UP' | 'DOWN' | 'IDLE';

export interface Vector2 {
    x: number;
    y: number;
}

export interface GameState {
    ball: {
        position: Vector2;
        velocity: Vector2;
        radius: number;
    };
    aiPaddle: {
        position: Vector2;
        width: number;
        height: number;
        side: 'left' | 'right';
    };
    opponentPaddle: {
        position: Vector2;
        width: number;
        height: number;
    };
    canvas: {
        width: number;
        height: number;
    };
    powerUps?: PowerUp[];
}

export interface PowerUp {
    id: string;
    type: string;
    position: Vector2;
    active: boolean;
}

export interface DifficultyParams {
    reactionTime: number;      // ms - délai avant action
    errorMargin: number;        // pixels - imprécision
    updateFrequency: number;    // ms - fréquence refresh
    speedMultiplier: number;    // vitesse de mouvement
    missChance: number;         // probabilité de rater (0-1)
    predictionAccuracy: number; // précision prédiction (0-1)
}

export interface PredictionResult {
    impactY: number;           // Position Y prédite
    impactTime: number;        // Temps avant impact (ms)
    confidence: number;        // Confiance prédiction (0-1)
    bounces: number;          // Nombre de rebonds
}

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultyParams> = {
    easy: {
        reactionTime: 400,      // Réaction très lente
        errorMargin: 80,        // Beaucoup d'erreurs
        updateFrequency: 1000,
        speedMultiplier: 0.5,
        missChance: 0.4,        // Rate souvent
        predictionAccuracy: 0.5
    },
    medium: {
        reactionTime: 100,        // Réaction instantanée (TEST)
        errorMargin: 20,         // Aucune erreur (TEST)
        updateFrequency: 1000,
        speedMultiplier: 1.0,
        missChance: 0.2,          // Ne rate jamais (TEST)
        predictionAccuracy: 0.8 // Prédiction parfaite (TEST)
    },
    hard: {
        reactionTime: 30,
        errorMargin: 5,
        updateFrequency: 1000,
        speedMultiplier: 1.0,
        missChance: 0.01,
        predictionAccuracy: 0.98
    }
};