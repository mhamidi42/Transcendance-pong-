import { FastifyInstance } from "fastify";
import { getUser, updateUserAlias, anonymizeUser, deleteUser, checkUserOauth, 
	createGithubUser, searchGithubUser, saveSecrets2FA, verify2fACode } from "../services/userService";
import crypto from "crypto";
import { exchangeTokenForCode } from "../utils/token";
import { updateUserAvatar } from "../services/userService";
import { setUserOnline, setUserOffline } from "../services/onlineStatusService";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import speakeasy from "speakeasy";
import { getOnlineStatus, isUserOnline } from "../services/onlineStatusService";
import { getFriends } from "../services/friendService"; // ou votre fonction pour récupérer les amis


async function authRoutes(fastify: FastifyInstance) {

	fastify.get("/auth/me/a2f", async (request, reply) => {
		await request.jwtVerify();
		const userId = (request.user as any)?.sub;
		
		if (!userId) {
			return reply.status(401).send({ error: "Not authenticated" });
		}
		const step = (request.user as any)?.step;
		if (step !== "2fa-setup") {
			return reply.status(400).send({ error: "2FA setup not required" });
		}
		const user = getUser(userId);
		setUserOnline(userId);
		return user;
	});

	fastify.get("/auth/me", async (request, reply) => {
		await request.jwtVerify();
		const userId = (request.user as any)?.sub;

		if (!userId) {
			return reply.status(401).send({ error: "Not authenticated" });
		}

		const step = (request.user as any)?.step;
		console.log("STEP =", step);
		if (step === "2fa-setup") {
			return reply.status(401).send({ error: "2FA setup required" });
		}

		const user = getUser(userId);
		return user;
	});

	fastify.post("/auth/logout", async (request, reply) => {
		await request.jwtVerify();
		setUserOffline((request.user as any)?.sub);
		reply.clearCookie("access-token");
		return { ok: true };
	});

	// --- UPDATE alias ---
	fastify.put("/auth/profile", async (request, reply) => {
		try {
			await request.jwtVerify();
		} catch (err) {
			return reply.status(401).send({ error: "Not authenticated" });
		}
		const userId = (request.user as any)?.sub;
		
		if (!userId) {
			return reply.status(401).send({ error: "Not authenticated" });
		}
		const { alias } = request.body as { alias?: string };
		if (!alias) {
			return reply.status(400).send({ error: "Alias is required" });
		}
		if (!/^[A-Za-z0-9_]{3,20}$/.test(alias)) {
			return reply.status(400).send({ error: "Invalid alias" });
		}

		try {
			const updatedUser = updateUserAlias(userId, alias); // simple service function
			return updatedUser;
		} catch (err: any) {
			if (err.message.includes("UNIQUE constraint failed: users.alias")) {
				return reply.status(409).send({ error: "This username is already taken" });
			}
			return reply.status(500).send({ error: "Internal server error" });
		}
	});

	// --- UPDATE avatar ---
	fastify.put("/auth/avatar", async (request, reply) => {
		try {
			await request.jwtVerify();
		} catch (err) {
			return reply.status(401).send({ error: "Not authenticated" });
		}
		const userId = (request.user as any)?.sub;

		if (!userId) {
			return reply.status(401).send({ error: "Not authenticated" });
		}

		const data = await request.file();
		if (!data) 
			return reply.status(400).send({ error: "No file uploaded" });

		// Vérifier que c’est une image (image/png, image/jpeg, etc.) :
		if (!data.mimetype.startsWith("image/")) {
    		return reply.status(400).send({ error: "Invalid file type" });
		}

		// Générer un nom unique pour éviter les collisions : (import path from "path";)
		const ext = path.extname(data.filename);
		const fileName = `avatar_${userId}_${Date.now()}${ext}`;

		// Sauvegarder le fichier dans /uploads/avatars/ (import fs from "fs";)
		const filePath = path.join(process.cwd(), "uploads", "avatars", fileName);
		await data.toBuffer().then(buffer => fs.writeFileSync(filePath, buffer));

		// Mettre à jour le chemin de l’avatar dans la base de données
		const updatedUser = updateUserAvatar(userId, `/uploads/avatars/${fileName}`);
		return updatedUser;
	});

	// --- ANONYMIZE USER ---
	fastify.post("/auth/anonymize", async (request, reply) => {
		try {
			await request.jwtVerify();
		} catch (err) {
			return reply.status(401).send({ error: "Not authenticated" });
		}
		const userId = (request.user as any)?.sub;

		if (!userId) {
			return reply.status(401).send({ error: "Not authenticated" });
		}

		try {
			const updatedUser = anonymizeUser(userId);
			return updatedUser;
		} catch (error) {
			return reply.status(500).send({ error: "Internal server error" });
		}
	});

	fastify.post("/auth/delete", async (request, reply) => {
		try {
			await request.jwtVerify();
		} catch (err) {
			return reply.status(401).send({ error: "Not authenticated" });
		}
		const userId = (request.user as any)?.sub;

		if (!userId) {
			return reply.status(401).send({ error: "Not authenticated" });
		}

		try {
			setUserOffline(userId);
			deleteUser(userId);

			// Suppression du cookie JWT
			reply.clearCookie("access-token");

			return { ok: true };
		} catch (error) {
			return reply.status(500).send({ error: "Internal server error" });
		}
	});

	//authentification OAth2 GitHub,

	fastify.get("/auth/github", async (request, reply) => {
		const clientId = process.env.GITHUB_CLIENT_ID;
		const redirectUri = process.env.GITHUB_REDIRECT_URI;
		
		if (!clientId || !redirectUri) {
			return reply.status(500).send({ error: "GitHub OAuth not configured" });
		}

		const state = crypto.randomBytes(16).toString("hex");

		reply.setCookie("oauth_state", state, {
			httpOnly: true,
			secure: false,
			sameSite: "lax",
			path: "/",
		});
		const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}` + 
		`&redirect_uri=${redirectUri}` + 
		`&state=${state}&scope=user:email`;
		
		return reply.redirect(githubAuthUrl);
	});

	fastify.get("/api/auth/callback/github", async (request, reply) => {
		const { code, state } = request.query as {
			code?: string;
			state?: string;
		};
	
		if (state !== request.cookies.oauth_state) {
			return reply.status(400).send("Invalid OAuth state");
		}

		try {
			const accessToken = await exchangeTokenForCode(code!);
			const resGitHub = await fetch ("https://api.github.com/user", {
				method: "GET",
				headers: {
					"Authorization": `Bearer ${accessToken}`,
					"Accept": "application/json",
				},			
			})
			const gitHubUser = await resGitHub.json();
			console.log ("GitHub user response", gitHubUser);
			if (!checkUserOauth(gitHubUser.id)){
				createGithubUser(gitHubUser.id, gitHubUser.login, gitHubUser.email, gitHubUser.avatar_url);
			}
			const resp = searchGithubUser(gitHubUser.id);
			const token = fastify.jwt.sign({ sub: resp }, { expiresIn: "1h" });
			reply.setCookie("access-token", token, {
				httpOnly: true,
				secure: false,
				sameSite: "lax",
				path: "/",
			});
			setUserOnline(resp);
			return reply.redirect("http://localhost:8080/");
		}
		catch (error) {
			return reply.status(500).send("Failed to exchange token");
		}
	});

	fastify.post("/2fa-setup", async (request, reply) => {
		await request.jwtVerify();
		const userId = (request.user as any)?.sub;

		const secret = speakeasy.generateSecret({ length: 20, 
			name: `ft_transcendence${userId}`, issuer: "ft_transcendence" });
		saveSecrets2FA(userId, secret.base32);
		const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url!);
		return { qrCode: qrCodeDataURL };
	});

	fastify.post("/2fa-verify", async (request, reply) => {
		await request.jwtVerify();
		const userId = (request.user as any)?.sub;
		const { code } = request.body as { code: string };
		const isVerified = verify2fACode(userId, code);
		if (!isVerified) {
			return reply.status(401).send({ error: "Invalid 2FA code" });
		}
		const token = fastify.jwt.sign({ sub: userId }, { expiresIn: "1h" });
		reply.setCookie("access-token", token, {
			httpOnly: true,
			secure: false,
			sameSite: "lax",
			path: "/",
		});
		return { ok: true };
	});
}

export { authRoutes };
