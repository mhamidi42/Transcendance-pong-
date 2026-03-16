import type { Page } from "../models/pageType.js";
import { postBackend } from "../communication/fetch.js";

export const TwoFASetupPage: Page = {
	  render: () => `
		<div class="page-container">
			<div class="card-glass">
		<!-- Card Header -->
		<div class="card-header">
		  <h2 class="text-2xl font-semibold text-white mb-2">Two-Factor Authentication Setup</h2>
		  <p class="text-muted">
			Scan the QR code below with your authenticator app and enter the generated code to complete the setup.
		  </p>
		</div>

		<!-- Card Content -->
		<div class="card-body">
		  <div id="qrCodeContainer" class="flex flex-col items-center gap-4">
			<!-- QR Code will be inserted here -->
		  </div>
		  <form id="twofaSetupForm" class="mt-4">
			<div class="form-group">
			  <label for="twofaCode" class="form-label">Authentication Code</label>
			  <input
				id="twofaCode"
				name="twofaCode"
				type="text"
				placeholder="Enter code from authenticator app"
				required
				class="input-field"
			  />
			</div>
			<button type="submit" class="btn btn-primary w-full mt-4">Verify & Enable 2FA</button>
		  </form>
		  <div id="twofaSetupError" class="text-red-500 mt-2"></div>
		</div>
	  </div>
	</div>
	`,
		onMount: async () => {
			const response = await postBackend<{ qrCode: string }>("/2fa-setup", {});
			const qrCodeContainer = document.getElementById("qrCodeContainer");
			if (qrCodeContainer && response.qrCode) {
				const img = document.createElement("img");
				img.src = response.qrCode;
				img.alt = "2FA QR Code";
				qrCodeContainer.appendChild(img);
			}
			
			const form = document.getElementById("twofaSetupForm") as HTMLFormElement;
			const errorDiv = document.getElementById("twofaSetupError") as HTMLDivElement;

			form.addEventListener("submit", async (e) => {
				e.preventDefault();
				errorDiv.textContent = "";
				const formData = new FormData(form);
				const code = formData.get("twofaCode") as string;

				try {
					await postBackend("/2fa-verify", { code });
					window.location.href = "/home";
				} catch (error) {
					errorDiv.textContent = "Invalid code. Please try again.";
				}
		});
	}
}
