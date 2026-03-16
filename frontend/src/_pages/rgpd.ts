import { type Page } from "../models/pageType.js";
import { navigateTo } from "../router.js";
import { currentUser, setCurrentUser } from "../store/userStore.js";

export const RgpdPage: Page = {
		render(): string {
			return `
				<div class="page-container">
					<div class="card w-full max-w-md grid gap-6">

						<h1>RGPD</h1>

						<p class="text-muted">
							Gérez vos données personnelles, conformément au RGPD.
						</p>

						<!-- Actions -->
						<div class="grid gap-3">
							<button id="rgpd-see-data" class="btn btn-secondary">
								Voir mes informations
							</button>

							<button id="rgpd-anonymize" class="btn btn-secondary">
								Anonymiser mon compte
							</button>

							<button id="rgpd-delete" class="btn btn-danger">
								Supprimer mon compte
							</button>
						</div>

						<!-- Résultat -->
						<div
							id="rgpd-content"
							class="glass-panel p-4 text-sm grid gap-2"
						></div>

						<!-- Navigation -->
						<div class="pt-4">
							<a href="/profile" data-link class="link-accent">
								← Retour au profil
							</a>
						</div>

					</div>
				</div>
			`;
		},


	onMount(): void {
		const user = currentUser;

		if (!user) {
			navigateTo("/login");
			return;
		}

		const seeDataButton = document.getElementById("rgpd-see-data");
		const anonymizeButton = document.getElementById("rgpd-anonymize");
		const deleteButton = document.getElementById("rgpd-delete");
		const content = document.getElementById("rgpd-content");

		if (!seeDataButton || !anonymizeButton || !deleteButton || !content) {
			return;
		}

		// --- Voir mes données ---
		seeDataButton.addEventListener("click", () => {
			content.innerHTML = `
				<h2>Mes informations personnelles</h2>
				<p><strong>Alias :</strong> ${user.alias}</p>
				<p><strong>Email :</strong> ${user.email}</p>
			`;
		});

		// --- Anonymisation ---
		anonymizeButton.addEventListener("click", async () => {
			const res = await fetch("/api/auth/anonymize", {
				method: "POST",
				credentials: "include"
			});

			if (res.ok) {
				const updatedUser = await res.json();
				setCurrentUser(updatedUser);

				content.innerHTML = `
					<h2>Anonymisation effectuée</h2>
					<p><strong>Alias :</strong> ${updatedUser.alias}</p>
					<p><strong>Email :</strong> ${updatedUser.email}</p>
				`;
			} else {
				content.innerHTML = `<p>Erreur lors de l’anonymisation.</p>`;
			}
		});

		// --- Suppression de compte ---
		deleteButton.addEventListener("click", async () => {
			const confirmed = confirm(
				"Cette action est définitive.\nVotre compte sera supprimé.\n\nContinuer ?"
			);

			if (!confirmed) {
				return;
			}

			const res = await fetch("/api/auth/delete", {
				method: "POST",
				credentials: "include"
			});

			if (res.ok) {
				// on nettoie le store et on dégage
				setCurrentUser(null);
				navigateTo("/login");
			} else {
				content.innerHTML = `<p>Erreur lors de la suppression du compte.</p>`;
			}
		});
	}
};
