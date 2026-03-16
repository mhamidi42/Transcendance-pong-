// // src/AI/index.ts

// /**
//  * Module IA pour Pong
//  * 
//  * Implémente un adversaire intelligent qui :
//  * - Prédit la trajectoire de la balle avec gestion des rebonds
//  * - Prend des décisions intelligentes avec comportement humain
//  * - Simule des inputs clavier (pas de triche)
//  * - Respecte la contrainte de refresh 1Hz
//  * - S'adapte à 3 niveaux de difficulté
//  * 
//  * Utilisation :
//  * ```typescript
//  * import { AIPlayer } from './AI';
//  * 
//  * const ai = new AIPlayer('medium');
//  * ai.start();
//  * 
//  * // Plus tard...
//  * ai.setDifficulty('hard');
//  * ai.stop();
//  * ```
//  */

// // Export des classes principales
// export { AIPlayer } from './AIPlayer';
// export { BallPredictor } from './BallPredictor';
// export { DecisionMaker } from './DecisionMaker';
// export { KeyboardSimulator } from './KeyboardSimulator';

// // Export des types
// export type {
//     Difficulty,
//     AIAction,
//     Vector2,
//     GameState,
//     PredictionResult,
//     DifficultyParams,
//     PowerUp
// } from './types';

// export { DIFFICULTY_SETTINGS } from './types';

// /**
//  * Fonction helper pour créer rapidement une IA
//  */
// export function createAI(
//     difficulty: 'easy' | 'medium' | 'hard' = 'medium',
//     options?: {
//         upKey?: string;
//         downKey?: string;
//         debugMode?: boolean;
//     }
// ) {
//     const ai = new AIPlayer(
//         difficulty,
//         options?.upKey || 'ArrowUp',
//         options?.downKey || 'ArrowDown'
//     );

//     if (options?.debugMode) {
//         ai.setDebugMode(true);
//     }

//     return ai;
// }

// /**
//  * Fonction pour tester l'IA
//  */
// export function testAI() {
//     console.log('=== AI Module Test ===');
    
//     const ai = createAI('medium', { debugMode: true });
//     console.log('✓ AI créée avec difficulté medium');
    
//     ai.start();
//     console.log('✓ AI démarrée');
    
//     const stats = ai.getStats();
//     console.log('✓ Stats:', stats);
    
//     setTimeout(() => {
//         ai.stop();
//         console.log('✓ AI arrêtée');
//     }, 5000);
    
//     return ai;
// }