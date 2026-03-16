// src/AI/BallPredictor.ts

import type { Vector2, GameState, PredictionResult } from './types.js';

/**
 * Prédit la trajectoire de la balle et le point d'impact
 * Algorithme : Simulation physique avec gestion des rebonds
 */
export class BallPredictor {
    private readonly MAX_BOUNCES = 5;
    private readonly TIME_STEP = 16; // ms (60 FPS simulation)
    private readonly MAX_SIMULATION_TIME = 5000; // 5 secondes max

    private clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Convertit une position top-left de balle en centre Y
     */
    private ballCenterY(ballTopLeftY: number, radius: number): number {
        return ballTopLeftY + radius;
    }

    /**
     * Prédit où la balle va frapper le paddle de l'IA
     */
    public predictImpact(gameState: GameState): PredictionResult {
        const { ball, aiPaddle, canvas } = gameState;

        // Copier l'état pour simulation
        let pos = { ...ball.position };
        let vel = { ...ball.velocity };
        let time = 0;
        let bounces = 0;

        // Déterminer le X d'impact sur le paddle IA (coordonnées top-left)
        // Le jeu considère une collision quand ball.x + size >= paddle.x (droite)
        // ou ball.x <= paddle.x + width (gauche)
        const targetX = aiPaddle.side === 'right'
            ? aiPaddle.position.x - (ball.radius * 2)
            : aiPaddle.position.x + aiPaddle.width;

        // Simuler jusqu'à atteindre le côté IA
        while (time < this.MAX_SIMULATION_TIME) {
            // Calculer prochaine position
            const nextPos = {
                // IMPORTANT: dans le jeu, vx/vy sont en pixels par frame
                // (ball.x += ball.vx à chaque frame). Donc on simule pareil.
                x: pos.x + vel.x,
                y: pos.y + vel.y
            };

            // Vérifier rebonds murs haut/bas
            const ballSize = ball.radius * 2;
            if (nextPos.y <= 0) {
                // Rebond mur haut
                vel.y = Math.abs(vel.y);
                nextPos.y = 0;
                bounces++;
            } else if (nextPos.y + ballSize >= canvas.height) {
                // Rebond mur bas
                vel.y = -Math.abs(vel.y);
                nextPos.y = canvas.height - ballSize;
                bounces++;
            }

            // Vérifier si on atteint le côté IA
            const reachedTarget = aiPaddle.side === 'right'
                ? nextPos.x >= targetX
                : nextPos.x <= targetX;

            if (reachedTarget) {
                // Interpoler la position Y exacte
                const t = (targetX - pos.x) / (nextPos.x - pos.x);
                const impactY = pos.y + (nextPos.y - pos.y) * t;

                const impactCenterY = this.ballCenterY(impactY, ball.radius);

                return {
                    // On renvoie le centre Y pour être cohérent avec le calcul d'impact du jeu
                    impactY: this.clamp(impactCenterY, ball.radius, canvas.height - ball.radius),
                    impactTime: time,
                    confidence: this.calculateConfidence(bounces, time),
                    bounces: bounces
                };
            }

            // Mettre à jour position
            pos = nextPos;
            time += this.TIME_STEP;

            // Sécurité : trop de rebonds = prédiction peu fiable
            if (bounces > this.MAX_BOUNCES) {
                break;
            }
        }

        // Fallback : retourner centre si prédiction impossible
        return {
            impactY: canvas.height / 2,
            impactTime: this.MAX_SIMULATION_TIME,
            confidence: 0.6, // Au lieu de 0.1
            bounces: bounces
        };
    }

    /**
     * Calcule la confiance dans la prédiction
     * Plus il y a de rebonds et de temps, moins on est sûr
     */
    private calculateConfidence(bounces: number, time: number): number {
        const bouncePenalty = Math.pow(0.9, bounces); // Moins de pénalité par rebond
        const timePenalty = 0.5 + (0.5 * (1 - (time / this.MAX_SIMULATION_TIME))); // Entre 0.5 et 1.0
        return Math.max(0.6, bouncePenalty * timePenalty); // Minimum 0.6 au lieu de 0.1
    }

    /**
     * Prédit la position de la balle à t + horizonMs (centre Y), via la même simulation.
     * Utile pour une IA qui rafraîchit à 1Hz et veut un "où sera la balle dans 1 seconde".
     */
    public predictPositionAt(gameState: GameState, horizonMs: number): { x: number; y: number; time: number; bounces: number; confidence: number } {
        const { ball, canvas } = gameState;

        let pos = { ...ball.position };
        let vel = { ...ball.velocity };
        let time = 0;
        let bounces = 0;

        const ballSize = ball.radius * 2;
        const targetTime = Math.max(0, horizonMs);

        while (time < targetTime && time < this.MAX_SIMULATION_TIME) {
            const nextPos = {
                x: pos.x + vel.x,
                y: pos.y + vel.y
            };

            if (nextPos.y <= 0) {
                vel.y = Math.abs(vel.y);
                nextPos.y = 0;
                bounces++;
            } else if (nextPos.y + ballSize >= canvas.height) {
                vel.y = -Math.abs(vel.y);
                nextPos.y = canvas.height - ballSize;
                bounces++;
            }

            pos = nextPos;
            time += this.TIME_STEP;

            if (bounces > this.MAX_BOUNCES) {
                break;
            }
        }

        const centerY = this.clamp(this.ballCenterY(pos.y, ball.radius), ball.radius, canvas.height - ball.radius);
        return {
            x: pos.x,
            y: centerY,
            time,
            bounces,
            confidence: this.calculateConfidence(bounces, time)
        };
    }

    /**
     * Vérifie si la balle se dirige vers l'IA
     */
    public isBallComingTowardsAI(gameState: GameState): boolean {
        const { ball, aiPaddle } = gameState;

        if (aiPaddle.side === 'right') {
            return ball.velocity.x > 0; // Balle va vers la droite
        } else {
            return ball.velocity.x < 0; // Balle va vers la gauche
        }
    }

    /**
     * Estime le temps avant impact (approximation rapide)
     */
    public estimateTimeToImpact(gameState: GameState): number {
        const { ball, aiPaddle } = gameState;

        const distance = aiPaddle.side === 'right'
            ? aiPaddle.position.x - ball.position.x
            : ball.position.x - (aiPaddle.position.x + aiPaddle.width);

        // vx/vy sont en pixels par frame. Convertir en ms avec TIME_STEP.
        const speedPerFrame = Math.abs(ball.velocity.x);

        if (speedPerFrame === 0) return Infinity;

        const frames = distance / speedPerFrame;
        return frames * this.TIME_STEP;
    }
}