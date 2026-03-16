import type { PongSettings } from "../types/types.js";

// ============================================
// 4. FONCTIONS UTILITAIRES (domApplier.ts)
// ============================================

// Séparation des responsabilités : application au DOM
export class DOMApplier {
	static applySettings(settings: PongSettings): void {
		this.applySelects(settings);
		this.applyRanges(settings);
		this.applyColors(settings);
		this.applyTextInputs(settings);
		this.applyNumbers(settings);
        this.applyBooleans(settings);
	}
  
	private static applySelects(settings: PongSettings): void {
		const difficulty = document.getElementById('aiDifficulty') as HTMLSelectElement;
		if (difficulty) difficulty.value = settings.difficulty;
	}
	
	private static applyRanges(settings: PongSettings): void {
		const ballSpeed = document.getElementById('ballSpeed') as HTMLInputElement;
		const ballSpeedValue = document.getElementById('ballSpeed-value');
		if (ballSpeed) ballSpeed.value = String(settings.ballSpeed);
		if (ballSpeedValue) ballSpeedValue.textContent = String(settings.ballSpeed);
		
		const paddleSpeed = document.getElementById('paddleSpeed') as HTMLInputElement;
		const paddleSpeedValue = document.getElementById('paddleSpeed-value');
		if (paddleSpeed) paddleSpeed.value = String(settings.paddleSpeed);
		if (paddleSpeedValue) paddleSpeedValue.textContent = String(settings.paddleSpeed);
	}
	
	private static applyColors(settings: PongSettings): void {
		const bgColor = document.getElementById('backgroundColor') as HTMLInputElement;
		if (bgColor) bgColor.value = settings.backgroundColor;
		
		const ballColor = document.getElementById('ballColor') as HTMLInputElement;
		if (ballColor) ballColor.value = settings.ballColor;
		
		const paddleColor = document.getElementById('paddleColor') as HTMLInputElement;
		if (paddleColor) paddleColor.value = settings.paddleColor;
	}
	
	private static applyTextInputs(settings: PongSettings): void {
		const keyNames: { [key: string]: string } = {
			'ArrowUp': '↑',
			'ArrowDown': '↓',
			'ArrowLeft': '←',
			'ArrowRight': '→',
			' ': 'Space',
			'Enter': '⏎',
			'Escape': 'Esc',
		};
		
		const getDisplayKey = (key: string): string => keyNames[key] || key.toUpperCase();
		
		const p1Up = document.getElementById('player1Up') as HTMLButtonElement;
		if (p1Up) {
			p1Up.dataset.key = settings.player1Up;
			p1Up.textContent = getDisplayKey(settings.player1Up);
		}
		
		const p1Down = document.getElementById('player1Down') as HTMLButtonElement;
		if (p1Down) {
			p1Down.dataset.key = settings.player1Down;
			p1Down.textContent = getDisplayKey(settings.player1Down);
		}
		
		const p2Up = document.getElementById('player2Up') as HTMLButtonElement;
		if (p2Up) {
			p2Up.dataset.key = settings.player2Up;
			p2Up.textContent = getDisplayKey(settings.player2Up);
		}
		
		const p2Down = document.getElementById('player2Down') as HTMLButtonElement;
		if (p2Down) {
			p2Down.dataset.key = settings.player2Down;
			p2Down.textContent = getDisplayKey(settings.player2Down);
		}
	}
	
	private static applyNumbers(settings: PongSettings): void {
		const maxScore = document.getElementById('maxScore') as HTMLInputElement;
		const maxScoreValue = document.getElementById('maxScore-value');
		if (maxScore) maxScore.value = String(settings.maxScore);
		if (maxScoreValue) maxScoreValue.textContent = String(settings.maxScore);
	}

    private static applyBooleans(settings: PongSettings): void {
        const powerUp = document.getElementById('powerUp') as HTMLInputElement;
        if (powerUp) powerUp.checked = settings.powerUp;
    }
}
