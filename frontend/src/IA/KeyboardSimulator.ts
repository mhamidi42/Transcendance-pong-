// src/AI/KeyboardSimulator.ts

import type { AIAction } from './types.js';
import { keys } from '../models/gamModels.js';

/**
 * Simule les inputs clavier pour l'IA
 * Respecte la contrainte : l'IA doit utiliser les mêmes inputs que les joueurs
 */
export class KeyboardSimulator {
    private currentKey: string | null = null;
    private keyUpKey: string;
    private keyDownKey: string;

    constructor(upKey: string = 'ArrowUp', downKey: string = 'ArrowDown') {
        this.keyUpKey = upKey;
        this.keyDownKey = downKey;
    }

    /**
     * Maintient une touche pressée de manière continue (appelé à 60fps)
     */
    public pressContinuous(action: AIAction): void {
        switch (action) {
            case 'UP':
                this.setKeyState(this.keyUpKey, true);
                this.setKeyState(this.keyDownKey, false);
                this.currentKey = this.keyUpKey;
                break;
            case 'DOWN':
                this.setKeyState(this.keyDownKey, true);
                this.setKeyState(this.keyUpKey, false);
                this.currentKey = this.keyDownKey;
                break;
            case 'IDLE':
                this.setKeyState(this.keyUpKey, false);
                this.setKeyState(this.keyDownKey, false);
                this.currentKey = null;
                break;
        }
    }

    /**
     * Simule le relâchement d'une touche
     */
    private releaseKey(key: string): void {
        // Modifier directement le tableau keys
        keys[key] = false;

        if (this.currentKey === key) {
            this.currentKey = null;
        }
    }

    /**
     * Définit l'état d'une touche directement (pour continuous movement)
     */
    private setKeyState(key: string, state: boolean): void {
        keys[key] = state;
    }

    /**
     * Relâche toutes les touches en cours
     */
    public releaseAll(): void {
        if (this.currentKey) {
            this.releaseKey(this.currentKey);
        }
    }

    /**
     * Change les touches de contrôle
     */
    public setKeys(upKey: string, downKey: string): void {
        this.releaseAll();
        this.keyUpKey = upKey;
        this.keyDownKey = downKey;
    }
}