import { type Page } from "../models/pageType.js";
import { getBackend, postBackend } from "../communication/fetch.js";
import type { TournamentResponse, UserResponse, MatchResponse } from "../models/responseModels.js";
import type { TournamentInfo } from "../models/tournamentInfo.js";
import { navigateTo } from "../router.js";
import { getCurrentUser } from "../store/userStore.js";
import { SettingsManager } from "../customization/index.js";
import { getSettingsPopupHTML } from "../customization/PopupSettings.js";

export const TournamentPage: Page = {
	render(): string {
		return `
			<section class="max-w-md mx-auto mt-12">
				<button id="btn-settings" class="btn btn-secondary items-center py-1 text-sm mb-4">
					Settings
				</button>
				<div class="glass-panel p-8 flex flex-col gap-6">

					<h1 class="title-elegant">Créer un tournoi</h1>

				<div class="flex flex-col gap-2">
					<label class="text-sm text-slate-300 uppercase tracking-wide">
						Nombre de joueurs
					</label>

					<div class="flex items-center gap-2">

						<select
							id="num-players"
							class="profile-input w-full text-black text-center"
						>
							<option value="3">3</option>
							<option value="4" selected>4</option>
							<option value="5">5</option>
							<option value="6">6</option>
							<option value="7">7</option>
							<option value="8">8</option>
							<option value="9">9</option>
							<option value="10">10</option>
							<option value="11">11</option>
							<option value="12">12</option>
							<option value="13">13</option>
							<option value="14">14</option>
							<option value="15">15</option>
							<option value="16">16</option>
						</select>

					</div>
				</div>

				<div class="flex flex-col gap-2">
					<label for="player-alias" class="text-sm text-slate-300 uppercase tracking-wide">
						Votre pseudo
					</label>
					<input
						type="text"
						id="player-alias"
						class="profile-input w-full text-black"
						placeholder="Ex: PlayerOne"
						maxlength="20"
						pattern="[A-Za-z0-9_]{3,20}"
						title="Alias: 3-20 caractères, lettres, chiffres et underscore uniquement"
						required
					/>
				</div>

				<div class="flex flex-col gap-3 pt-2 border-t border-white/10">
					<h2 class="text-sm text-slate-300 uppercase tracking-wide">
						Joueurs du tournoi
					</h2>

					<p class="text-xs text-slate-400">
						Renseignez les alias des autres joueurs.
					</p>

					<div id="players-container" class="flex flex-col gap-3">
						<!-- Champs alias générés dynamiquement -->
					</div>
				</div>


					<button	id="create-tournament" class="btn btn-primary mt-4">
						Lancer le tournoi
					</button>

					<p id="result" class="text-sm text-center text-slate-400"></p>

					<a href="/" data-link class="btn btn-ghost text-center">
						← Retour à l’accueil
					</a>

				</div>
			</section>
			${getSettingsPopupHTML()}
		`;
	},

	onMount(): void {
		const button = document.getElementById("create-tournament") as HTMLButtonElement;
		const result = document.getElementById("result") as HTMLParagraphElement;
		const input = document.getElementById("num-players") as HTMLSelectElement;
		const aliasInput = document.getElementById("player-alias") as HTMLInputElement;
		const playersContainer = document.getElementById("players-container") as HTMLDivElement;
		const ID_USER = getCurrentUser();
		const settingsManager = new SettingsManager(ID_USER);
		const buttonSettings = document.getElementById("btn-settings") as HTMLButtonElement;

		if (!button || !result || !input || !aliasInput || !playersContainer || !buttonSettings) return;

		buttonSettings.addEventListener("click", () => { settingsManager.open(); });

		const updatePlayerInputs = () => {
			const nbPlayers = Number(input.value);

			const existingAliases = Array.from(
				playersContainer.querySelectorAll("input")
			).map(i => i.value);

			playersContainer.innerHTML = "";

			for (let i = 1; i < nbPlayers; i++) {
				const wrapper = document.createElement("div");
				wrapper.className = "flex flex-col gap-2";

				const label = document.createElement("label");
				label.className = "text-sm text-slate-300 uppercase tracking-wide";
				label.textContent = `Joueur ${i + 1}`;

				const inputAlias = document.createElement("input");
				inputAlias.type = "text";
				inputAlias.className = "profile-input w-full text-black";
				inputAlias.placeholder = `Alias du joueur ${i + 1}`;
				inputAlias.maxLength = 20;
				inputAlias.pattern = "[A-Za-z0-9_]{3,20}";
				inputAlias.title = "Alias: 3-20 caractères, lettres, chiffres et underscore uniquement";
				inputAlias.required = true;
				inputAlias.value = existingAliases[i - 1] ?? "";

				wrapper.appendChild(label);
				wrapper.appendChild(inputAlias);
				playersContainer.appendChild(wrapper);
			}
		};

		updatePlayerInputs();

		input.addEventListener("change", updatePlayerInputs);

		button.onclick = async () => {
			result.textContent = "";

			const nbPlayers = Number(input.value);
			if (nbPlayers < 3 || nbPlayers > 16) {
				result.textContent = "Le nombre de joueurs doit être entre 3 et 16.";
				return;
			}

			const mainAlias = aliasInput.value.trim();
			if (!mainAlias) {
				result.textContent = "Veuillez entrer votre pseudo.";
				return;
			}

			// Validation: pas de caractères spéciaux
			const aliasRegex = /^[A-Za-z0-9_]{3,20}$/;
			if (!aliasRegex.test(mainAlias)) {
				result.textContent = "Votre alias doit contenir uniquement des lettres, chiffres et underscore (3-20 caractères).";
				return;
			}

			const otherAliases = Array.from(
				playersContainer.querySelectorAll("input")
			).map(i => i.value.trim());

			for (const alias of otherAliases) {
				if (alias && !aliasRegex.test(alias)) {
					result.textContent = `L'alias "${alias}" contient des caractères non autorisés. Uniquement lettres, chiffres et underscore.`;
					return;
				}
			}

			const allAliases = [mainAlias, ...otherAliases];
			const uniqueAliases = new Set(allAliases.map(a => a.toLowerCase()));
			if (uniqueAliases.size !== allAliases.length) {
				result.textContent = "Erreur: Vous avez entré deux fois le même alias. Tous les joueurs doivent avoir des pseudos différents.";
				return;
			}

			try {
				const tournament = await postBackend<TournamentResponse>("/tournaments");
				result.textContent += `Tournoi créé (id=${tournament.id})\n`;

				const currentUser = await getBackend<UserResponse>("/auth/me");
				await postBackend(`/tournaments/${tournament.id}/players`, { userId: currentUser.id });
				await postBackend(`/tournaments/${tournament.id}/${currentUser.id}/setalias`, { alias: mainAlias });

				for (let i = 0; i < otherAliases.length; i++) {
					const alias = otherAliases[i];
					const user = await postBackend<UserResponse>("/users/default", { alias: `Invite_${tournament.id}_${i + 1}` });
					await postBackend(`/tournaments/${tournament.id}/players`, { userId: user.id });
					await postBackend(`/tournaments/${tournament.id}/${user.id}/setalias`, { alias });
					result.textContent += `Joueur ajouté : ${alias}\n`;
				}
	
				await postBackend(`/tournaments/${tournament.id}/generate-matches`);
				result.textContent += "Matchs générés 🎉\n";

				const tournamentInfo: TournamentInfo = {
					id: tournament.id,
					currentMatchId: (await getBackend<MatchResponse>(`/matches/next/${tournament.id}`)).id
				};

				navigateTo(`/match?match=${tournamentInfo.currentMatchId}&tournament=${tournamentInfo.id}`);
			} catch (error) {
				console.error(error);
				result.textContent += `Erreur : ${error}`;
			}
		};
	}
};
