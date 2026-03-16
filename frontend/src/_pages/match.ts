import { type Page } from "../models/pageType.js";
import { gameLoop, onKeyDown, onKeyUp, applyVisualSettings, gameRunning, animationId, setAnimationId, setOnStateUpdate, resetBallInMiddle } from "../game/gameloop.js";
import type { matchInfo } from "../models/matchInfo.js";
import { SettingsManager } from "../customization/index.js";
import { getBackend, postBackend } from "../communication/fetch.js";
import type { MatchInfoResponse, TournamentPlayerResponse } from "../models/responseModels.js";
import type { GameMode } from "../store/gameMode.js";
import { getCurrentUser } from "../store/userStore.js";
import type { PongSettings } from "../types/types.js";
import { AIPlayer } from "../IA/AIPlayer.js";
import { cleanUp } from "../utils/cleanUp.js";
import { renderDashboard } from "../utils/dashboard.js";

function isMatchFinishedUIVisible(): boolean {
	const overlay = document.getElementById("match-end-overlay");
	const tournamentPanel = document.getElementById("tournament-end-panel");
	return (
		(overlay !== null && !overlay.classList.contains("hidden")) ||
		(tournamentPanel !== null && !tournamentPanel.classList.contains("hidden"))
	);
}

function isPlayer2Key(key: string, settings: PongSettings): boolean {
	return key === settings.player2Up || key === settings.player2Down;
}

async function buildRemoteInviteLink(matchId: number): Promise<string> {
	const response = await fetch("http://localhost:3000/server-info", {
		credentials: "include"
	});

	if (!response.ok) {
		throw new Error("Failed to fetch server info");
	}

	const data = await response.json();
	const ip = data.ip;

	const protocol = window.location.protocol;
	const port = window.location.port ? ":" + window.location.port : "";
	console.log(`${protocol}//${ip}${port}/match?match=${matchId}&remote=true`);
	return `${protocol}//${ip}${port}/match?match=${matchId}&remote=true`;

}


/* =======================
   WebSocket / Roles
======================= */

let ws: WebSocket | null = null;
let isRemote = false;
let isHost = false;
let iaForUnmount = false;
let aiPlayer: AIPlayer | null = null;

/* =======================
   Keyboard handlers
======================= */

let handleKeyDown: ((e: KeyboardEvent) => void) | null = null;
let handleKeyUp: ((e: KeyboardEvent) => void) | null = null;

export let matchFinished = false;
let globMatchId: number;
let globTournamentId: number | undefined;

export const MatchPage: Page = {
	render(): string {
		return `
		<section class="flex flex-col items-center justify-start pt-20 h-screen px-4 overflow-hidden">
			<div class="flex justify-between items-center mb-4 w-[700px]">
				<h2 class="text-2xl font-bold m-0">Match Arena</h2>
			</div>

				<div class="flex items-center justify-center gap-6">
					<span
						id="player-left-name"
						class="w-32 text-right text-lg font-medium text-slate-300"
					>
					</span>

					<div class="score text-3xl font-bold">
						<span id="score-left">0</span>
						<span class="mx-2">:</span>
						<span id="score-right">0</span>
					</div>

					<span
						id="player-right-name"
						class="w-32 text-left text-lg font-medium text-slate-300"
					>
					</span>
				</div>


			<div class="pong-field">
				<div class="net"></div>
				<div class="paddle paddle-left"></div>
				<div class="paddle paddle-right"></div>
				<div class="ball"></div>
			</div>

				<div id="tournament-end-panel" class="hidden mt-6">
					<div class="glass-panel flex flex-col items-center gap-4 p-6">
						<h2 class="title-elegant text-xl">Match terminé</h2>
						<button id="btn-next-match" class="btn btn-primary">
							Next match
						</button>
					</div>
				</div>

				<div id="match-end-overlay" class="popup-overlay hidden">
					<div class="glass-panel flex flex-col items-center gap-6 p-8">
						<h2 class="title-elegant">Match terminé</h2>

						<div class="text-center space-y-2">
							<p class="text-lg font-semibold text-emerald-400">
								🏆 <span id="winner-name"></span>
							</p>

							<p class="text-sm text-slate-300">
								<span id="score-line"></span>
							</p>

							<p class="text-sm text-rose-400">
								💀 <span id="loser-name"></span>
							</p>
						</div>

						<button id="btn-return-home" class="btn btn-primary mt-4">
							Return to Home
						</button>
					</div>
				</div>

				<div class="flex justify-between items-center mt-4 pt-4 border-t border-white/10 w-[700px]">
					<a href="/" data-link class="btn btn-ghost">Back</a>
					<button id="start-match" class="btn btn-primary">Start Match</button>
				</div>
			</section>
			
			<div
				id="tournament-dashboard-container"
				class="absolute top-1/2 right-4 hidden">
				<div class="glass-panel p-4 w-72">
					<h3 class="text-sm uppercase tracking-wide text-slate-400 mb-3">
						Classement
					</h3>

					<table class="w-full text-sm">
						<thead>
							<tr class="text-slate-400 border-b border-white/10">
								<th class="text-left py-1">#</th>
								<th class="text-left py-1">Joueur</th>
								<th class="text-right py-1">Pts</th>
								<th class="text-right py-1">Matchs</th>
							</tr>
						</thead>
						<tbody id="tournament-ranking">
							<!-- Injecté dynamiquement -->
						</tbody>
					</table>
				</div>
			</div>
	`;
	},

	async onMount(): Promise<void> {
		const params = new URLSearchParams(window.location.search);
		const matchId = Number(params.get("match"));
		const ia = params.get("ia") === "true";
		if (ia) iaForUnmount = true;
		const tournamentId = Number(params.get("tournament"));
		isRemote = params.get("remote") === "true";
		const isInvite = params.get("invite") === "true";


		const startBtn = document.getElementById("start-match");
		if (isRemote && startBtn) {
			startBtn.style.display = "none";
		}

		if (!isRemote && isInvite) {
			(async () => {
				let remoteLink: string;

				try {
					remoteLink = await buildRemoteInviteLink(matchId);
				} catch (e) {
					console.error(e);
					alert("Impossible de générer le lien d'invitation");
					return;
				}

				const overlay = document.createElement("div");
				overlay.style.position = "fixed";
				overlay.style.top = "0";
				overlay.style.left = "0";
				overlay.style.width = "100%";
				overlay.style.height = "100%";
				overlay.style.background = "rgba(0,0,0,0.6)";
				overlay.style.display = "flex";
				overlay.style.alignItems = "center";
				overlay.style.justifyContent = "center";
				overlay.style.zIndex = "2000";

				const popup = document.createElement("div");
				popup.style.background = "#111";
				popup.style.padding = "20px";
				popup.style.borderRadius = "8px";
				popup.style.width = "520px";
				popup.style.color = "white";

				popup.innerHTML = `
					<h3>Invite a friend</h3>
					<p>Share this link with your friend:</p>

					<input
						id="invite-link"
						type="text"
						readonly
						value="${remoteLink}"
						style="width:100%; padding:8px; color:black;"
					/>

					<div style="margin-top:12px; text-align:right;">
						<button id="invite-copy">Copy</button>
						<button id="invite-close">Close</button>
					</div>
				`;

				overlay.appendChild(popup);
				document.body.appendChild(overlay);

				const input = document.getElementById("invite-link") as HTMLInputElement;
				input.focus();
				input.select();

				const closeBtn = document.getElementById("invite-close");
				closeBtn?.addEventListener("click", () => {
					document.body.removeChild(overlay);
				});

				const copyBtn = document.getElementById("invite-copy");
				copyBtn?.addEventListener("click", async () => {
					try {
						await navigator.clipboard.writeText(remoteLink);
						copyBtn.textContent = "Copied!";
					} catch {
						input.select();
					}
				});
			})();
		}


		globMatchId = matchId;
		if (tournamentId) globTournamentId = tournamentId;

		const ID_USER = getCurrentUser();
		const settingsManager = new SettingsManager(ID_USER);

		const handeBeforeUnload = (_e: BeforeUnloadEvent) => {
			// if (isRemote) return;
			if (isMatchFinishedUIVisible()) return;
			cleanUp(matchId, tournamentId);
		};
		window.addEventListener("beforeunload", handeBeforeUnload);

		let currentSettings = settingsManager.getSettings();

		applyVisualSettings(currentSettings);

		// Créer les handlers avec les settings actuels
		handleKeyDown = (e: KeyboardEvent) => onKeyDown(e, currentSettings);
		handleKeyUp = (e: KeyboardEvent) => onKeyUp(e, currentSettings);

		/* =======================
		   WebSocket init
		======================= */

		// Utiliser wss:// via nginx pour respecter le sujet (HTTPS obligatoire)
		const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
		const wsHost = window.location.hostname;
		const wsPort = window.location.port || (wsProtocol === "wss" ? "443" : "80");

		ws = new WebSocket(
			`${wsProtocol}://${wsHost}:${wsPort}/ws?match=${matchId}`
		);

		ws.onopen = () => {
			console.log("🔗 WS connected");
		};

		ws.onmessage = (event) => {
			const msg = JSON.parse(event.data);

			// INPUT venant du remote → appliqué côté host
			if (msg.type === "input" && isHost) {
				if (ia && isPlayer2Key(msg.key, currentSettings)) {
					return;
				}
				const e = new KeyboardEvent(
					msg.pressed ? "keydown" : "keyup",
					{ key: msg.key }
				);
				msg.pressed
					? onKeyDown(e, currentSettings)
					: onKeyUp(e, currentSettings);
			}

			// ÉTAT venant du host → appliqué côté remote
			if (msg.type === "state" && isRemote) {
				const s = msg.state;

				const paddleLeft = document.querySelector(".paddle-left") as HTMLElement;
				const paddleRight = document.querySelector(".paddle-right") as HTMLElement;
				const ball = document.querySelector(".ball") as HTMLElement;

				if (paddleLeft) paddleLeft.style.top = `${s.paddleLeftY}px`;
				if (paddleRight) paddleRight.style.top = `${s.paddleRightY}px`;
				if (ball) ball.style.left = `${s.ballX}px`;
				if (ball) ball.style.top = `${s.ballY}px`;

				const sl = document.getElementById("score-left");
				const sr = document.getElementById("score-right");
				if (sl && sr) {
					sl.textContent = String(s.score1);
					sr.textContent = String(s.score2);
				}
			}
		};

		/* =======================
		   Keyboard handling
		======================= */

		handleKeyDown = (e: KeyboardEvent) => {
			if (ws && isRemote && ws.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify({
					type: "input",
					key: e.key,
					pressed: true
				}));
				return;
			}
			if (ia && !isRemote && isPlayer2Key(e.key, currentSettings)) {
				e.preventDefault();
				return;
			}
			onKeyDown(e, currentSettings);
		};

	// 	handleKeyDown = (e: KeyboardEvent) => {

	// 	// MODE REMOTE — client
	// 	if (ws && isRemote && ws.readyState === WebSocket.OPEN) {
	// 		ws.send(JSON.stringify({
	// 			type: "input",
	// 			key: e.key,
	// 			pressed: true
	// 		}));
	// 		return;
	// 	}

	// 	// MODE REMOTE — host (invite=true)
	// 	// Le host n'a PAS le droit de contrôler le paddle remote
	// 	if (isInvite === true) {
	// 		if (
	// 			e.key === currentSettings.player2Up ||
	// 			e.key === currentSettings.player2Down
	// 		) {
	// 			return;
	// 		}
	// 	}

	// 	onKeyDown(e, currentSettings);
	// };


		handleKeyUp = (e: KeyboardEvent) => {
			if (ws && isRemote && ws.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify({
					type: "input",
					key: e.key,
					pressed: false
				}));
				return;
			}
			if (ia && !isRemote && isPlayer2Key(e.key, currentSettings)) {
				e.preventDefault();
				return;
			}
			onKeyUp(e, currentSettings);
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		/* =======================
		   Match Setup & Start
		======================= */
		
		let gameState: matchInfo | null = null;
		const gameMode: GameMode = tournamentId
			? { mode: "tournament", tournamentId }
			: { mode: "match" };

		try {
			if (tournamentId != 0 && !isNaN(tournamentId)) {
				const playersInfo = await getBackend<TournamentPlayerResponse[]>(`/tournaments/${tournamentId}/points`);
				renderDashboard(playersInfo);
			}
			
			const info = await getBackend<MatchInfoResponse>(`/matches/${matchId}`);
			
			gameState = {
				mode: gameMode,
				matchId,
				score1: info.score1,
				score2: info.score2,
				id_player1: info.id_player1,
				id_player2: info.id_player2,
				winner: null,
				loser: null,
				winner_id: null,
				name_player1: info.name_player1,
				name_player2: info.name_player2,
				max_score: currentSettings.maxScore,
				isAI: ia
			};

			const playerLeftName = document.getElementById("player-left-name");
			const playerRightName = document.getElementById("player-right-name");

			if (gameState.mode.mode === "tournament") {
				try {
					const aliasTournament = await getBackend<{ alias: string }>(`/tournaments/${tournamentId}/${gameState.id_player1}/getalias`);
					if (playerLeftName) playerLeftName.textContent = aliasTournament.alias;
				} catch (e) {
					if (playerLeftName) playerLeftName.textContent = gameState.name_player1;
				}
				
				try {
					const aliasTournament2 = await getBackend<{ alias: string }>(`/tournaments/${tournamentId}/${gameState.id_player2}/getalias`);
					if (playerRightName) playerRightName.textContent = aliasTournament2.alias;
				} catch (e) {
					if (playerRightName) playerRightName.textContent = gameState.name_player2;
				}
			} else {
				if (playerLeftName) playerLeftName.textContent = gameState.name_player1;
				if (playerRightName) playerRightName.textContent = gameState.name_player2;
			}

		} catch (e) {
			console.error("Failed to setup match", e);
		}

		/* =======================
		   Start Button Logic
		======================= */
		
		const button = document.getElementById("start-match") as HTMLButtonElement;
		
		if (button) {
			button.addEventListener("click", async () => {
				if (isRemote) {
					console.log("Remote client: no gameLoop");
					return;
				}
				
				if (!gameState) return;
				
				if (button.dataset.clicked) return;
				button.dataset.clicked = "true";
				button.classList.add("hidden");
				
				isHost = true;

				if (ws && ws.readyState === WebSocket.OPEN) {
					setOnStateUpdate((s) => {
						ws!.send(JSON.stringify({
							type: "state",
							state: s
						}));
					});
				}

				try {
					await postBackend(`/matches/${matchId}/start`);
				} catch (e) {
					console.error("Error starting match backend:", e);
				}

				if (gameState.isAI) {
					const aiDifficulty = currentSettings.difficulty === 'none' ? 'medium' : currentSettings.difficulty;
					console.log("🎮 AI Difficulty:", aiDifficulty);
					aiPlayer = new AIPlayer(
						aiDifficulty,
						currentSettings.player2Up,
						currentSettings.player2Down
					);
					
					aiPlayer.start();
				}
				
				// Update max score check settings
				gameState.max_score = currentSettings.maxScore;
				
				gameLoop(gameState, currentSettings, aiPlayer);
			});
		}
	},

	onUnmount(): void {
		matchFinished = true;
		if (iaForUnmount){
			iaForUnmount = false;
			aiPlayer?.stop();
		}

		if (handleKeyDown) window.removeEventListener("keydown", handleKeyDown);
		if (handleKeyUp) window.removeEventListener("keyup", handleKeyUp);

		if (animationId !== null) {
			cancelAnimationFrame(animationId);
			setAnimationId(null);
		}

		if (ws) {
			ws.close();
			ws = null;
		}
		
	},

	async onBeforeLeave(): Promise<void> {
		// Remote client should not delete match/guests for the host.
		// if (isRemote) return;

		const isFinished = isMatchFinishedUIVisible();

		const scoreleftEl = document.getElementById("score-left") as HTMLDivElement;
		const scorerightEl = document.getElementById("score-right") as HTMLDivElement;
		const paddleleftEl = document.getElementById("paddle-left") as HTMLDivElement;
		const paddlerightEl = document.getElementById("paddle-right") as HTMLDivElement;
		if (paddleleftEl && paddlerightEl && scoreleftEl && scorerightEl) {
			paddleleftEl.style.display = "none";
			paddlerightEl.style.display = "none";
			scoreleftEl.style.display = "none";
			scorerightEl.style.display = "none";
		}
		resetBallInMiddle();

		this.onUnmount!();
		if (isFinished) return;
		await cleanUp(globMatchId, globTournamentId);
	}
};
