import type { TournamentPlayerResponse } from "../models/responseModels.js";
import { escapeHtml } from "./escapeHtml.js";

export function renderDashboard(
	players: TournamentPlayerResponse[]
): void {
	const container = document.getElementById("tournament-dashboard-container");
	const tbody = document.getElementById("tournament-ranking");

	if (!container || !tbody) return;

	const sorted = [...players].sort((a, b) => b.points - a.points);

	tbody.innerHTML = sorted
		.map(
			(player, index) => `
				<tr class="border-b border-white/5">
					<td class="py-1">${index + 1}</td>
					<td class="py-1 font-medium">${escapeHtml(player.alias)}</td>
					<td class="py-1 text-right font-semibold">${player.points}</td>
					<td class="py-1 text-right font-semibold">${player.nb_games}</td>
				</tr>
			`
		)
		.join("");

	container.classList.remove("hidden");
}

// const playersInfo = await getBackend<TournamentPlayerResponse[]>(`/tournaments/${tournamentId}/points`);
// structure des joueurs participants au tournoi
