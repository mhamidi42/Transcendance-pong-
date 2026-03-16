import { FastifyInstance } from "fastify";
import { createUser, getAllUsers, getUser, getUserByEmail, deleteDefaultUser } from "../services/userService";
import { getUserSettings, updateUserSettings } from "../services/settingsService";
import { getMatchesForUser } from "../services/userMatchService";
import { setUserOnline } from "../services/onlineStatusService";
import bcrypt from "bcryptjs";

async function usersRoutes(fastify: FastifyInstance) {
	const isValidAlias = (alias: unknown): alias is string => {
		return (
			typeof alias === "string" &&
			/^[A-Za-z0-9_]{3,20}$/.test(alias)
		);
	};

	fastify.post("/users/default", async (request, reply) => {
		const alias = request.body as { alias: string };

		if (!alias)
				return reply.status(400).send({ error: "Missing alias" });
		if (!isValidAlias(alias.alias)) {
			return reply.status(400).send({ error: "Invalid alias" });
		}
		try{
			const user = createUser(alias.alias, null, null, false);
			return user;
		}
		catch (err: any) {
			if (err.message.includes("UNIQUE constraint failed: users.alias")) {
				return reply
					.status(409)
					.send({ error: "This username is already taken" });
			}
	}});

	fastify.post("/users", async (request, reply) => {
		const { email, alias, password, twofa } = request.body as any;

		if (!email || !alias || !password) {
			return reply.status(400).send({ error: "Missing fields" });
		}
		if (!isValidAlias(alias)) {
			return reply.status(400).send({ error: "Invalid alias" });
		}
		try {
			const user = createUser(alias, email, password, twofa);
			if (twofa) {
				const token = fastify.jwt.sign({ sub: user.id, step: "2fa-setup" }, { expiresIn: "5m" });
				setUserOnline(user.id);
				reply.setCookie("access-token", token, {
					httpOnly: true,
					secure: false,
					sameSite: "lax",
					path: "/",
				})
			}
			return reply.send(user);
		} catch (err: any) {
			if (err.message.includes("UNIQUE constraint failed: users.alias")) {
				return reply
					.status(409)
					.send({ error: "This username is already taken" });
			}

			if (err.message.includes("UNIQUE constraint failed: users.email")) {
				return reply
					.status(409)
					.send({ error: "This email is already taken" });
			}

			return reply.status(500).send({ error: "Internal server error" });
		}
	});
	
	// --- LOGIN ---
    fastify.post("/auth/login", async (request, reply) => {
        const body = request.body as { email?: string; password?: string };
        if (!body.email || !body.password) {
            return reply.status(400).send({ error: "Email and password are required" });
        }

		console.log("🔐 Login attempt for:", body.email);

        const user = getUserByEmail(body.email);
		
		if (!user) {
			console.log("User not found");
			return reply.status(401).send({ error: "Email ou mot de passe incorrect" });
		}

		console.log("User found:", { id: user.id, alias: user.alias, email: user.email });
		console.log("Password hash in DB:", user.password_hash);
		console.log("Password provided:", body.password);
		
		const passwordMatch = bcrypt.compareSync(body.password, user.password_hash);
		console.log("✅ Password match:", passwordMatch);

        if (!passwordMatch) {
            return reply.status(401).send({ error: "Email ou mot de passe incorrect" });
        }

		if (user.twoFactorEnabled && !user.twoFactorConfirmed) {
			const tempToken = fastify.jwt.sign({ sub: user.id, step: "2fa-verify" }, { expiresIn: "5m" });
			reply.setCookie("access-token", tempToken, {
				httpOnly: true,
				secure: false,
				sameSite: "lax",
				path: "/",
			});
			return reply.status(200).send({ requires2FA: true });
		}
		setUserOnline(user.id);
		const token = fastify.jwt.sign({ sub: user.id }, { expiresIn: "1h" });
		reply.setCookie("access-token", token, {
			httpOnly: true,
			secure: false,
			sameSite: "lax",
			path: "/",
		});

		return reply.send({ ok: true, id: user.id, alias: user.alias, email: user.email, is_online: true });
	});
	
	// --- GET LOGGED-IN USER ---> auth.ts
	// --- LOGOUT ---> auth.ts

	// --- GET ALL USERS ---
	fastify.get("/users", async (request, reply) => {
		try {
			const users = getAllUsers();
			return users;
		} catch (error) {
			reply.status(500);
			return { error: "failed to fetch users" };
		}
	});

	// --- GET USER BY ID ---
	fastify.get("/users/:id", async (request, reply) => {
		const params = request.params as { id: string };
		const userId = Number(params.id);

		try {
			const user = getUser(userId);

			if (!user) {
				reply.status(404);
				return { error: "user not found" };
			}

			return user;
		} catch (error) {
			reply.status(500);
			return { error: "failed to fetch user" };
		}
	});

	// --- USER SETTINGS ---
	fastify.get("/users/:id/settings", async (request, reply) => {
		const params = request.params as { id: string };
		const userId = Number(params.id);

		try {
			const settings = getUserSettings(userId);

			if (settings === null) {
				reply.status(404);
				return { error: "settings not found for this user" };
			}
			return settings;
		} catch (error) {
			reply.status(500);
			return { error: "failed to fetch settings" };
		}
	});

	fastify.post("/users/:id/settings", async (request, reply) => {
		const params = request.params as { id: string };
		const userId = Number(params.id);
		const body = request.body as any;

		try {
			updateUserSettings(userId, body);
			return { ok: true };
		} catch (error) {
			reply.status(500);
			return { error: "failed to update settings" };
		}
	});

	// ici service pour avoir accees au match d'un user
	fastify.get("/users/:id/matches", async (request, reply) => {
		const params = request.params as { id: string };
		const userId = Number(params.id);

		try {
			const matches = getMatchesForUser(userId);
			return matches;
		} catch (error) {
			reply.status(500);
			return { error: "failed to fetch user matches" };
		}
	});

	fastify.delete("/users/default/", async (request, reply) => {
		try {
			deleteDefaultUser();
			return { ok: true };
		}
		catch (error) {
			reply.status(500);
			return { error: "failed to delete user" };
		}
	});
}

export { usersRoutes };
