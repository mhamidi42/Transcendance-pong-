import type { matchInfo } from "../models/matchInfo.js";
import { keys, paddleleft, paddleright, ball } from "../models/gamModels.js";
import { postBackend, getBackend, deleteBackend } from "../communication/fetch.js";
import type { MatchResponse, TournamentPlayerResponse } from "../models/responseModels.js";
import { navigateTo } from "../router.js";
import type { PongSettings } from "../types/types.js";
import { AIPlayer } from "../IA/AIPlayer.js";
import { renderDashboard } from "../utils/dashboard.js";
import { matchFinished } from "../_pages/match.js";
let onStateUpdate: ((state: {
	paddleLeftY: number;
	paddleRightY: number;
	ballX: number;
	ballY: number;
	score1: number;
	score2: number;
}) => void) | null = null;

export function setOnStateUpdate(
	cb: typeof onStateUpdate
) {
	onStateUpdate = cb;
}


const MAX_BOUNCE_ANGLE = Math.PI / 3;

function isColliding(
	ballX: number,
	ballY: number,
	ballSize: number,
	paddleX: number,
	paddleY: number,
	paddleWidth: number,
	paddleHeight: number
): boolean {
	return (
		ballX < paddleX + paddleWidth &&
		ballX + ballSize > paddleX &&
		ballY < paddleY + paddleHeight &&
		ballY + ballSize > paddleY
	);
}

// Calculer l'impact de la balle sur la raquette
function computeImpact(
	ballY: number,
	ballSize: number,
	paddleY: number,
	paddleHeight: number
): number {
	const ballCenter = ballY + ballSize / 2;
	const paddleCenter = paddleY + paddleHeight / 2;
	const relative = (ballCenter - paddleCenter) / (paddleHeight / 2);
	return Math.max(-1, Math.min(1, relative));
}

// Appliquer l'angle de rebond en fonction de l'impact
function applyBounce(impact: number, direction: number) {
	const speed = Math.hypot(ball.vx, ball.vy);
	const angle = impact * MAX_BOUNCE_ANGLE;

	ball.vx = speed * Math.cos(angle) * direction;
	ball.vy = speed * Math.sin(angle);
}

let gameRunning = false;
let animationId: number | null = null;
let ballInMiddle = false;
let collisionCount = 0;

export function setAnimationId(id: number | null){
	animationId = id;}

export function resetBallInMiddle() {
	ballInMiddle = false;
}

export function resetCollisionCount() {
	collisionCount = 0;
}

// Gérer les entrées clavier
function onKeyDown(e: KeyboardEvent, settings: PongSettings) {
	const validkeys = [settings.player1Up, settings.player1Down, settings.player2Up, settings.player2Down];
	if (validkeys.includes(e.key)) {
		e.preventDefault();
		keys[e.key] = true;
	}
}

function onKeyUp(e: KeyboardEvent, settings: PongSettings) {
	const validkeys = [settings.player1Up, settings.player1Down, settings.player2Up, settings.player2Down];
	if (validkeys.includes(e.key)) {
		e.preventDefault();
		keys[e.key] = false;
	}
}

// Réinitialiser la position de la balle au centre
function resetBall(field: HTMLElement, settings: PongSettings) {
	ball.x = field.clientWidth / 2 - ball.size / 2;
	ball.y = field.clientHeight / 2 - ball.size / 2;

	const speedMultiplier = settings.ballSpeed / 5;
	ball.vx = (Math.random() > 0.5 ? 4 : -4) * speedMultiplier;
	ball.vy = (Math.random() > 0.5 ? 3 : -3) * speedMultiplier;
}

function applyVisualSettings(settings: PongSettings) {
	const field = document.querySelector(".pong-field") as HTMLElement;
	const paddleLeft = document.querySelector(".paddle-left") as HTMLElement;
	const paddleRight = document.querySelector(".paddle-right") as HTMLElement;
	const ballEl = document.querySelector(".ball") as HTMLElement;
	
	if (field) field.style.backgroundColor = settings.backgroundColor;
	if (paddleLeft) paddleLeft.style.backgroundColor = settings.paddleColor;
	if (paddleRight) paddleRight.style.backgroundColor = settings.paddleColor;
	if (ballEl) ballEl.style.backgroundColor = settings.ballColor;
}

// Boucle principale du jeu
async function gameLoop(state: matchInfo, settings: PongSettings, aiPlayer: AIPlayer | null = null) {
	gameRunning = true;
	paddleleft.speed = settings.paddleSpeed;
	paddleright.speed = settings.paddleSpeed;
	const field = document.querySelector(".pong-field") as HTMLElement;
	const paddleLeftEl = document.querySelector(".paddle-left") as HTMLElement;
	const paddleRightEl = document.querySelector(".paddle-right") as HTMLElement;
	const ballEl = document.querySelector(".ball") as HTMLElement;

	const scoreLeftEl = document.getElementById("score-left");
	const scoreRightEl = document.getElementById("score-right");

	if (!field || !paddleLeftEl || !paddleRightEl || !ballEl) return;

	if (ballInMiddle == false) {
		resetBall(field, settings);
		ballInMiddle = true;
	}

	// Déplacement paddle gauche via clavier
	if (keys[settings.player1Up]) paddleleft.y -= paddleleft.speed;
	if (keys[settings.player1Down]) paddleleft.y += paddleleft.speed;
	
	// Déplacement paddle droit : TOUJOURS lire les touches (humain OU IA)
	if (keys[settings.player2Up]) paddleright.y -= paddleright.speed;
	if (keys[settings.player2Down]) paddleright.y += paddleright.speed;
	
	const maxY = field.clientHeight - paddleLeftEl.clientHeight;
	paddleleft.y = Math.max(0, Math.min(maxY, paddleleft.y));
	paddleright.y = Math.max(0, Math.min(maxY, paddleright.y));

	paddleLeftEl.style.top = `${paddleleft.y}px`;
	paddleRightEl.style.top = `${paddleright.y}px`;

	ball.x += ball.vx;
	ball.y += ball.vy;

	if (ball.y <= 0 || ball.y + ball.size >= field.clientHeight) {
		ball.vy *= -1;
	}

	// Collision avec paddle gauche
	if (isColliding(ball.x, ball.y, ball.size, paddleLeftEl.offsetLeft, paddleleft.y, paddleLeftEl.clientWidth, paddleLeftEl.clientHeight)) {
		const impact = computeImpact(ball.y, ball.size, paddleleft.y, paddleLeftEl.clientHeight);
		applyBounce(impact, 1);
		if (settings.powerUp)
			collisionCount++;
	}

	// Collision avec paddle droit
	if (isColliding(ball.x, ball.y, ball.size, paddleRightEl.offsetLeft, paddleright.y, paddleRightEl.clientWidth, paddleRightEl.clientHeight)) {
		const impact = computeImpact(ball.y, ball.size, paddleright.y, paddleRightEl.clientHeight);
		applyBounce(impact, -1);
		if (settings.powerUp)
			collisionCount++;
	}

	if (ball.x <= 0) {
		if (collisionCount >= 10) {
			state.score2 += 2;
			collisionCount = 0;
		} else {
			state.score2++;
		}
		resetBall(field, settings);
	}
	if (ball.x + ball.size >= field.clientWidth) {
		if (collisionCount >= 10) {
			state.score1 += 2;
			collisionCount = 0;
		} else {
			state.score1++;
		}
		resetBall(field, settings);
	}

	if (scoreLeftEl && scoreRightEl) {
		scoreLeftEl.textContent = String(state.score1);
		scoreRightEl.textContent = String(state.score2);
	}

	//fin du match

	if (state.score1 >= settings.maxScore || state.score2 >= settings.maxScore) {
				// pour que le remote voit bien le score finale
				if (onStateUpdate) {
			onStateUpdate({
				paddleLeftY: paddleleft.y,
				paddleRightY: paddleright.y,
				ballX: ball.x,
				ballY: ball.y,
				score1: state.score1,
				score2: state.score2
			});
		}
		gameRunning = false;
		
		if (aiPlayer) {
			aiPlayer.stop();
			console.log("🤖 AI stopped");
		}
		if (animationId)
			cancelAnimationFrame(animationId);
		if (state.score1 >= settings.maxScore) {
			await postBackend(`/matches/${state.matchId}/score`, {
				score1: state.score1,
				score2: state.score2,
				winner_alias: state.name_player1,
				loser_alias: state.name_player2,
				winner_id: state.id_player1,
			});
			state.winner = state.name_player1;
			state.loser = state.name_player2;
			state.winner_id = state.id_player1;
		}

		else if (state.score2 >= settings.maxScore) {
			await postBackend(`/matches/${state.matchId}/score`, {
				score1: state.score1,
				score2: state.score2,
				winner_alias: state.name_player2,
				loser_alias: state.name_player1,
				winner_id: state.id_player2,
			});
			state.winner = state.name_player2;
			state.loser = state.name_player1;
			state.winner_id = state.id_player2;
		}

		await postBackend(`/matches/${state.matchId}/finish`, {});

		console.log("🏁 Match finished");
		animationId = null;
		if (state.mode.mode === "tournament") {
			try {
				await postBackend(`/tournament/${state.mode.tournamentId}/${state.winner_id}/points`);
				const playersInfo = await getBackend<TournamentPlayerResponse[]>(`/tournaments/${state.mode.tournamentId}/points`);
				renderDashboard(playersInfo);
			}
			catch (error) {
				console.error("Error updating dashboard after match finish:", error);
			}
			try {
				const status = await getBackend<{ finished: boolean }>(`/tournaments/${state.mode.tournamentId}/status`);
				if (status.finished) {
					const panel = document.getElementById("tournament-end-panel");
					const nextBtn = document.getElementById("btn-next-match");

					await deleteBackend(`/users/default/`);

					if (!panel || !nextBtn) return;

					panel.classList.remove("hidden");
					nextBtn.textContent = "Return to Home";
					nextBtn.onclick = () => navigateTo("/");

					return;
				}
			}
			catch (error) {
				console.error("Error checking tournament' status", error);
			}
			try{

				const id = state.mode.tournamentId;
				const next = await getBackend<MatchResponse>(
					`/matches/next/${id}`
				);
	
				const panel = document.getElementById("tournament-end-panel");
				const nextBtn = document.getElementById("btn-next-match");
	
				if (panel && nextBtn) {
					panel.classList.remove("hidden");
	
					if (next.id) {
						nextBtn.onclick = () => {
							navigateTo(`/match?match=${next.id}&tournament=${id}`);
						};
					}
				}
			}
			catch (error) {
				console.error("Error handling tournament next match:", error);
			}
			//	} else {

			//	}
			//}
		}
		else {
			await deleteBackend(`/users/default/`);
			const overlay = document.getElementById("match-end-overlay");
			const homeBtn = document.getElementById("btn-return-home");
			const winnerEl = document.getElementById("winner-name");
			const loserEl = document.getElementById("loser-name");
			const scoreEl = document.getElementById("score-line");

			if (overlay && homeBtn && winnerEl && loserEl && scoreEl) {
				overlay.classList.remove("hidden");
				winnerEl.textContent = state.winner ?? "Unknown";
				loserEl.textContent = state.loser ?? "Unknown";
				scoreEl.textContent = `${state.score1} - ${state.score2}`;

				homeBtn.onclick = () => {
					navigateTo("/");
				};
			}
		}
		return;
	}

	ballEl.style.left = `${ball.x}px`;
	ballEl.style.top = `${ball.y}px`;

	if (onStateUpdate) {
	onStateUpdate({
		paddleLeftY: paddleleft.y,
		paddleRightY: paddleright.y,
		ballX: ball.x,
		ballY: ball.y,
		score1: state.score1,
		score2: state.score2
	});
}


	animationId = requestAnimationFrame(() => gameLoop(state, settings, aiPlayer));
}

export { gameLoop, onKeyDown, onKeyUp, gameRunning, animationId, applyVisualSettings };
