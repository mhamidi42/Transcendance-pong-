import { type Page } from "../models/pageType.js";
import { navigateTo } from "../router.js"; // pour naviguer après login
import { loadCurrentUser } from "../store/userStore.js";
// import { updateNavMenu } from "./navbar.js";


// Définition de la page Login
export const LoginPage: Page = {
	// La fonction render retourne le HTML de la page
	render: () => `
		<div class="page-container">
			<div class="card-glass">
				<!-- Card Header -->
				<div class="card-header">
					<h2 class="text-2xl font-semibold text-white mb-2">Login to your account</h2>
					<p class="text-muted">
						Enter your email below to login to your account
					</p>
					<div class="mt-4">
						<a data-link href="/register" class="link-accent">
							Don't have an account? Sign up
						</a>
					</div>
				</div>

				<!-- Card Content -->
				<div class="card-body">
					<form id="loginForm">
						<div class="flex flex-col gap-6">
							<div class="form-group">
								<label for="email" class="form-label">Email</label>
								<input
									id="email"
									name="email"
									type="email"
									placeholder="m@example.com"
									required
									class="input-field"
								/>
							</div>
							<div class="form-group">
								<label for="password" class="form-label">Password</label>
								<input
									id="password"
									name="password"
									type="password"
									required
									class="input-field"
								/>
							</div>
						</div>
					</form>
				</div>

				<!-- Card Footer -->
				<div class="card-footer">
					<button
						type="submit"
						form="loginForm"
						class="btn btn-primary w-full"
					>
						Login
					</button>
					<div id="loginError" class="text-red-400 text-sm text-center mt-2"></div>
				</div>
			</div>
		</div>
	`,

	// onMount est appelée automatiquement par le router quand la page est affichée
	onMount: () => {
		// On récupère le formulaire du DOM
		const form = document.getElementById("loginForm") as HTMLFormElement;
		
		// On écoute l'événement submit du formulaire
		form.addEventListener("submit", async (e) => {
			e.preventDefault();// empêche le rechargement de la page

			// Récupère les données du formulaire
			const formData = new FormData(form);
			const email = formData.get("email");
			const password = formData.get("password");

			// On fait un appel HTTP au backend pour tenter de se connecter
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
				credentials: "include" // pour les cookies
			});
			
			if (res.status === 401) {
				const data = await res.json();
				if (data.error === "2FA setup required") {
					navigateTo("/2fa-setup");
					return;
				}
			}
			
			if (res.ok) {
				await loadCurrentUser();
				// await updateNavMenu();
				navigateTo("/home"); // redirige vers Home après login
			} else {
				// Sinon on affiche un message d'erreur
				const errorDiv = document.getElementById("loginError")!;
				errorDiv.textContent = "Email ou mot de passe incorrect";
			}
		});
	}
};
