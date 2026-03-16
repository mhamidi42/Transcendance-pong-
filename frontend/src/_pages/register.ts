import { type Page } from "../models/pageType.js";
import { navigateTo } from "../router.js";
import { loadCurrentUser } from "../store/userStore.js";


export const RegisterPage: Page = {
  render: () => `
		<div class="page-container">
			<div class="card-glass">
        <!-- Card Header -->
        <div class="card-header">
          <h2 class="text-2xl font-semibold text-white mb-2">Create your account</h2>
          <p class="text-muted">
            Enter your details below to create your account
          </p>
          <div class="mt-4">
            <a data-link href="/login" class="link-accent">
              Already have an account? Sign in
            </a>
          </div>
        </div>

        <!-- Card Content -->
        <div class="card-body">
          <form id="registerForm">
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
                <label for="username" class="form-label">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="username"
                  required
                  class="input-field"
                />
              </div>
              <div class="form-group">
                <label for="password" class="form-label">Password</label>
                <input id="password" name="password" type="password" required class="input-field"/>
              </div>
              <div class="form-group flex items-center gap-2">
                <input
                  id="enable2fa"
                  name="enable2fa"
                  type="checkbox"
                  class="w-4 h-4 rounded border-gray-600 bg-gray-700 text-accent-600 focus:ring-accent-500"
                />
                <label for="enable2fa" class="form-label mb-0">Activer l'A2F</label>
              </div>
            </div>
          </form>
        </div>

        <!-- Card Footer -->
        <div class="card-footer">
          <!-- GitHub login -->
          <a
            href="/api/auth/github"
            class="btn btn-secondary w-full mb-3 flex items-center justify-center gap-2"
          >
            Se connecter avec GitHub
          </a>
          
          <!-- Register -->
          <button type="submit" form="registerForm" class="btn btn-primary w-full">
            Register
          </button>
          
          <div id="registerError" class="text-red-400 text-sm text-center mt-2"></div>
        </div>
      </div>
    </div>
  `,
  onMount: () => {
    const form = document.getElementById("registerForm") as HTMLFormElement;
	const checkBox = document.getElementById("enable2fa") as HTMLInputElement;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

		const formData = new FormData(form);
		const email = formData.get("email");
		const alias = formData.get("username") as string;
		const password = formData.get("password");
		const forbidden = /^[A-Za-z0-9_]{3,20}$/;
		if (!alias || !forbidden.test(alias)) {
			document.getElementById("registerError")!.textContent =
				"Username must be 3-20 characters: letters, numbers, and underscores only";
			return;
		}
		// Validation côté client AVANT d'envoyer
		if (alias && alias.startsWith("Invit")) {
			document.getElementById("registerError")!.textContent =
				"Usernames starting with 'Invit' are not allowed";
			return;
		}

		const submitBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
		if (submitBtn) submitBtn.disabled = true;

		try {
			let twofa: boolean = false;
			if (checkBox.checked) {
				twofa = true;
			}
			const res = await fetch("/api/users", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, alias, password, twofa }),
			credentials: "include"
			});

			if (!res.ok) {
					const err = await res.json();
					document.getElementById("registerError")!.textContent =
						err.error || "Registration failed";
					if (submitBtn) submitBtn.disabled = false;
					return;
			}

			// AUTO-LOGIN
			//const loginRes = await fetch("/api/auth/login", {
			//	method: "POST",
			//	headers: { "Content-Type": "application/json" },
			//	body: JSON.stringify({ email, password }),
			//	credentials: "include"
			//});

			// if (!loginRes.ok) {
			// 	// Fallback: redirect to login page
			// 	navigateTo("/login");
			// 	return;
			// }

			// await loadCurrentUser();
			// await updateNavMenu();
			if (twofa)
				navigateTo("/2fa-setup");
			else
				navigateTo("/login");

			} catch {
				document.getElementById("registerError")!.textContent =
					"Unable to reach server";
				if (submitBtn) submitBtn.disabled = false;
			}
		});
	}
};

