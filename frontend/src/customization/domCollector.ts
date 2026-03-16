import type { PongSettings } from "../types/types.js";

// // ============================================
// // 3. FONCTIONS UTILITAIRES (domCollector.ts)
// // ============================================

// Séparation des responsabilités : collecte depuis le DOM
export class DOMCollector {
	static collectSettings(settings: PongSettings): void {
		this.collectSelects(settings);
		this.collectRanges(settings);
		this.collectColors(settings);
		this.collectTextInputs(settings);
		this.collectNumbers(settings);
        this.collectBooleans(settings);
	}
	
	private static collectSelects(settings: PongSettings): void {
		const difficulty = document.getElementById('aiDifficulty') as HTMLSelectElement;
		if (difficulty) {
			settings.difficulty = difficulty.value as 'none' | 'easy' | 'medium' | 'hard';
		}
	}

	private static collectRanges(settings: PongSettings): void {
		const ballSpeed = document.getElementById('ballSpeed') as HTMLInputElement;
		if (ballSpeed) settings.ballSpeed = Number(ballSpeed.value);

		const paddleSpeed = document.getElementById('paddleSpeed') as HTMLInputElement;
		if (paddleSpeed) settings.paddleSpeed = Number(paddleSpeed.value);
	}
	
	private static collectColors(settings: PongSettings): void {
		const bgColor = document.getElementById('backgroundColor') as HTMLInputElement;
		if (bgColor) settings.backgroundColor = bgColor.value;
		
		const ballColor = document.getElementById('ballColor') as HTMLInputElement;
		if (ballColor) settings.ballColor = ballColor.value;
		
		const paddleColor = document.getElementById('paddleColor') as HTMLInputElement;
		if (paddleColor) settings.paddleColor = paddleColor.value;
	}
	
	private static collectTextInputs(settings: PongSettings): void {
		// Récupérer depuis les data-key des boutons (pas des inputs)
		const p1Up = document.getElementById('player1Up') as HTMLButtonElement;
		if (p1Up && p1Up.dataset.key) settings.player1Up = p1Up.dataset.key;
		
		const p1Down = document.getElementById('player1Down') as HTMLButtonElement;
		if (p1Down && p1Down.dataset.key) settings.player1Down = p1Down.dataset.key;
		
		const p2Up = document.getElementById('player2Up') as HTMLButtonElement;
		if (p2Up && p2Up.dataset.key) settings.player2Up = p2Up.dataset.key;
		
		const p2Down = document.getElementById('player2Down') as HTMLButtonElement;
		if (p2Down && p2Down.dataset.key) settings.player2Down = p2Down.dataset.key;
	}

    private static collectBooleans(settings: PongSettings): void {
        const powerUp = document.getElementById('powerUp') as HTMLInputElement;
        if (powerUp) settings.powerUp = powerUp.checked;
    }

	private static collectNumbers(settings: PongSettings): void {
		const maxScore = document.getElementById('maxScore') as HTMLInputElement;
		if (maxScore) settings.maxScore = Number(maxScore.value);
	}
}
