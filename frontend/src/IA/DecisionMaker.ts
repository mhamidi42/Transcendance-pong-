// src/AI/DecisionMaker.ts

import type { AIAction, Difficulty, PredictionResult, DifficultyParams } from './types.js';
import { DIFFICULTY_SETTINGS } from './types.js';

/**
 * Prend les décisions de mouvement de l'IA
 * Ajoute des erreurs et comportements humains selon la difficulté
 */
export class DecisionMaker {
    private difficulty: Difficulty;
    private params: DifficultyParams;

    constructor(difficulty: Difficulty = 'medium') {
        this.difficulty = difficulty;
        this.params = DIFFICULTY_SETTINGS[difficulty];
    }

    /**
     * Décide quelle action effectuer
     */
    public decide(
        prediction: PredictionResult,
        currentPaddleY: number,
        paddleHeight: number
    ): AIAction {
        // 1. Vérifier si on doit parfois rater (comportement humain)
        if (this.shouldMiss()) {
            return this.getRandomAction();
        }

        // 2. Calculer le centre du paddle
        const paddleCenter = currentPaddleY + (paddleHeight / 2);

        // 3. Calculer la différence avec la cible prédite
        let diff = prediction.impactY - paddleCenter;

        // 4. Ajouter une erreur aléatoire selon difficulté
        const error = this.getRandomError();
        diff += error;

        // 5. Ajuster selon la confiance de la prédiction
        diff *= prediction.confidence;

        // 6. Zone morte : éviter les micro-mouvements
        const deadZone = this.getDeadZone();
        if (Math.abs(diff) < deadZone) {
            return 'IDLE';
        }

        // 7. Décider de la direction
        return diff > 0 ? 'DOWN' : 'UP';
    }

    /**
     * Décide si l'IA devrait "rater" (comportement humain)
     */
    private shouldMiss(): boolean {
        return Math.random() < this.params.missChance;
    }

    /**
     * Génère une erreur aléatoire selon la difficulté
     */
    private getRandomError(): number {
        const range = this.params.errorMargin;
        return (Math.random() - 0.5) * 2 * range;
    }

    /**
     * Obtient la zone morte (seuil de mouvement)
     */
    private getDeadZone(): number {
        const baseDeadZone = 30; // pixels - augmenté pour éviter les micro-mouvements
        // Zone morte entre 10 et 30 pixels selon la difficulté
        return Math.max(10, baseDeadZone * (1 - this.params.predictionAccuracy * 0.7));
    }

    /**
     * Retourne une action aléatoire (pour les "erreurs")
     */
    private getRandomAction(): AIAction {
        const actions: AIAction[] = ['UP', 'DOWN', 'IDLE'];
        return actions[Math.floor(Math.random() * actions.length)] ?? 'IDLE';
    }

    /**
     * Change la difficulté
     */
    public setDifficulty(difficulty: Difficulty): void {
        this.difficulty = difficulty;
        this.params = DIFFICULTY_SETTINGS[difficulty];
    }

    /**
     * Obtient les paramètres actuels
     */
    public getParams(): DifficultyParams {
        return { ...this.params };
    }

    /**
     * Évalue si l'IA devrait utiliser un power-up
     */
    public shouldUsePowerUp(
        powerUpType: string,
        gameState: any
    ): boolean {
        // Logique simple pour l'instant
        // TODO: Améliorer selon les types de power-ups
        
        switch (this.difficulty) {
            case 'easy':
                // L'IA easy utilise rarement les power-ups
                return Math.random() < 0.3;
            
            case 'medium':
                // Medium utilise les power-ups de façon modérée
                return Math.random() < 0.6;
            
            case 'hard':
                // Hard utilise les power-ups intelligemment
                return Math.random() < 0.9;
            
            default:
                return false;
        }
    }

    /**
     * Calcule un score de priorité pour une position cible
     * (utile pour choisir entre plusieurs objectifs)
     */
    public evaluatePosition(
        targetY: number,
        currentY: number,
        confidence: number
    ): number {
        const distance = Math.abs(targetY - currentY);
        const normalizedDistance = 1 - (distance / 500); // Normaliser sur hauteur canvas
        
        // Score = proximité × confiance
        return normalizedDistance * confidence;
    }
}