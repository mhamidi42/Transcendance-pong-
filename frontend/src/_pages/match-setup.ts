import type { Page } from "../models/pageType.js";
import { postBackend, getBackend } from "../communication/fetch.js";
import { navigateTo } from "../router.js";
import type { UserResponse, MatchResponse } from "../models/responseModels.js";
import { getSettingsPopupHTML } from "../customization/PopupSettings.js";
import { SettingsManager } from "../customization/index.js";
import { getCurrentUser } from "../store/userStore.js";

export const MatchSetupPage: Page = {
	render(): string {
		return `
			<section class="max-w-md mx-auto mt-12">
				<button id="btn-settings" class="btn btn-secondary items-center py-1 text-sm mb-4">
					Settings
				</button>
				<div class="card-glass">
					<div class="card-header text-center">
							<h2 class="title-display text-2xl">Create Match</h2>
							<p class="text-muted">Choose your game mode</p>
						</div>

						<div class="card-body flex flex-col gap-4">
							<button id="start-match" class="btn btn-secondary w-full justify-start">
								Local 1v1
							</button>
							
							<button id="IA" class="btn btn-secondary w-full justify-start">
								Play vs AI
							</button>
							
							<button id="Remote" class="btn btn-secondary w-full justify-start">
								Invite a Friend
							</button>
						</div>

						<div class="card-footer items-center">
							<pre id="error" class="text-red-400 text-sm min-h-[20px] text-center"></pre>
							<a href="/" data-link class="btn btn-ghost">
								Back
							</a>
						</div>
					</div>
				${getSettingsPopupHTML()}
			</section>
		`;
	},

	onMount(): void {
		console.log("🛠 MatchSetupPage mounted");
		const button = document.getElementById("start-match") as HTMLButtonElement;
		const buttonIA = document.getElementById("IA") as HTMLButtonElement;
		const buttonRemote = document.getElementById("Remote") as HTMLButtonElement;
		const error = document.getElementById("error") as HTMLPreElement;
		const ID_USER = getCurrentUser();
		const settingsManager = new SettingsManager(ID_USER);
		const buttonSettings = document.getElementById("btn-settings") as HTMLButtonElement;
		
		if (!button || !buttonIA || !buttonRemote || !error || !buttonSettings) return;

		buttonSettings.onclick = () => { settingsManager.open(); };

		button.onclick = async () => {
			try {
				const p1 = await getBackend<UserResponse>("/auth/me");
				const p2 = await postBackend<UserResponse>("/users/default", { alias: "Invite" });
				
				const match = await postBackend<MatchResponse>("/matches");
				
				await postBackend(`/matches/${match.id}/${p1.id}`);
				await postBackend(`/matches/${match.id}/${p2.id}`);

				navigateTo(`/match?match=${match.id}`);

			} catch (e) {
				console.error(e);
				error.textContent = "Erreur lors de la création du match.";
			}
		};

		buttonIA.onclick = async () => {
			try {
				const p1 = await getBackend<UserResponse>("/auth/me");
				const p2 = await postBackend<UserResponse>("/users/default", { alias: "Invite_IA" });
				
				const match = await postBackend<MatchResponse>("/matches");
				
				await postBackend(`/matches/${match.id}/${p1.id}`);
				await postBackend(`/matches/${match.id}/${p2.id}`);
				navigateTo(`/match?match=${match.id}&ia=true`);
			} catch (e) {
				console.error(e);
				error.textContent = "Erreur lors de la création du match avec IA.";
			}
		};

		buttonRemote.onclick = async () => {
		try {
			const p1 = await getBackend<UserResponse>("/auth/me");

			const match = await postBackend<MatchResponse>("/matches");

			await postBackend(`/matches/${match.id}/${p1.id}`);

			// Host ouvre le match normalement
			navigateTo(`/match?match=${match.id}&invite=true`);


			// 👉 le lien remote sera :
			// /match?match=ID&remote=true
		} catch (e) {
			console.error(e);
			error.textContent = "Erreur lors de la création du match remote.";
		}
	};

	}
}