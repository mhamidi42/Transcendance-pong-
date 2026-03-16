import { type Page } from "../models/pageType.js";
import { navigateTo } from "../router.js";
import { currentUser, setCurrentUser } from "../store/userStore.js";
import { escapeHtml } from "../utils/escapeHtml.js";

export const ProfilePage: Page = {
	render(): string {
		return `
		<h1>Profile</h1>
		<div id="profileContent">Loading...</div>
		<a href="/" data-link>Retour</a>
		<a href="/rgpd" data-link>RGPD</a>`;
	},

	onMount(): void {
		const user = currentUser;

		if (!user) {
			navigateTo("/login");
			return;
		}

		const isAnonymized = user.alias.startsWith("anonymous_");

		const content = document.getElementById("profileContent");
		if (!content)
			return;

		content.innerHTML = `
			<div class="page-container">
				<div class="card w-full max-w-md grid gap-6">

					<!-- Avatar -->
					<div class="flex flex-col items-center gap-3">
						<img
							id="profileAvatar"
							src="${user.avatar ? `http://localhost:3000${escapeHtml(user.avatar)}` : 'http://localhost:3000/uploads/avatars/default.png'}"
							alt="Avatar"
							class="w-24 h-24 rounded-full border border-white/10"
						/>
						<p class="text-muted">Photo de profil</p>
					</div>
					<!-- Email -->
					<div class="form-group">
						<label class="form-label">Email</label>
						<p class="text-muted">${escapeHtml(user.email)}</p>
					</div>			
					<!-- Alias -->
					<div class="form-group">
						<label class="form-label">Alias</label>
						${
							isAnonymized
								? `<p class="text-muted">${escapeHtml(user.alias)}</p>`
								: `
									<div class="flex gap-2">
										<input
											type="text"
											id="aliasInput"
											value="${escapeHtml(user.alias)}"
											class="input-field"
										/>
										<button id="saveAlias" class="btn btn-primary">
											Save
										</button>
									</div>
								`
						}
					</div>
					<!-- Upload avatar -->
					<div class="form-group">
						<label class="form-label">Changer l’avatar</label>
						<input type="file" id="avatarInput" class="text-sm text-slate-300" />
						<button id="uploadAvatar" class="btn btn-secondary">
							Upload avatar
						</button>
					</div>

					<!-- Message -->
					<div id="message" class="text-muted text-center"></div>

					<!-- Navigation -->
					<div class="flex justify-between pt-4">
						<a href="/" data-link class="link-accent">← Retour</a>
						<a href="/rgpd" data-link class="link-accent">RGPD</a>
					</div>

				</div>
			</div>
		`;


		// Si l'utilisateur est anonymisé, on ne bind rien
		if (isAnonymized)
			return;

		// ---- Sauvegarde alias ----
		document.getElementById("saveAlias")?.addEventListener("click", async () => {
			const input = document.getElementById("aliasInput") as HTMLInputElement | null;
			if (!input)
				return;

			const newAlias = input.value;

			const res = await fetch("/api/auth/profile", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ alias: newAlias }),
				credentials: "include"
			});

			const msg = document.getElementById("message");

			if (!msg)
				return;

			if (res.ok) {
				const updated = await res.json();
				setCurrentUser(updated);
				msg.textContent = "✓ Saved";
			} else {
				msg.textContent = "Failed to save";
			}
		});
	
		// ---- Upload avatar ----
		document.getElementById("uploadAvatar")?.addEventListener("click", async () => {
		const fileInput = document.getElementById("avatarInput") as HTMLInputElement;
		if (!fileInput.files || fileInput.files.length === 0) return alert("Select a file");

		const file = fileInput.files[0];
		const formData = new FormData();
		formData.append("file", fileInput.files[0]!);

		try {
			const res = await fetch("/api/auth/avatar", {
				method: "PUT",
				body: formData,
				credentials: "include",
			});

			if (res.ok) {
				const updatedUser = await res.json();
				setCurrentUser(updatedUser);

				// Met à jour l'image en direct
				const avatarImg = document.getElementById("profileAvatar") as HTMLImageElement;
				if (avatarImg) {
					avatarImg.src = `http://localhost:3000${escapeHtml(updatedUser.avatar)}?t=${Date.now()}`;
					// ?t=timestamp force le refresh du cache
				}

				alert("Avatar uploaded!");
			} 
			else {
				const error = await res.json();
				alert("Upload failed: " + error.error);
			}
		} catch (err) {
			alert("Upload failed");
		}
		});
	}
};
