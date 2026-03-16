import { FastifyInstance } from "fastify";
import { getFriends, addFriend, removeFriend } from "../services/friendService";
import { db } from "../db/sqlite";
import { getOnlineStatus } from "../services/onlineStatusService";

async function friendsRoutes(fastify: FastifyInstance) {
	// --- Lister tous les amis ---
	fastify.get("/friends/list", async (request, reply) => {
		try {
			await request.jwtVerify();
		} catch (err) {
			return reply.status(401).send({ error: "Not authenticated" });
		}
		const userId = (request.user as any)?.sub;
		if (!userId) return reply.status(401).send({ error: "Not authenticated" });

		// 1️⃣ récupérer les amis
		const friends = getFriends(userId);

		// 2️⃣ récupérer l'état en ligne
		const friendIds = friends.map(f => f.id);
		const statusMap = getOnlineStatus(friendIds);

		// 3️⃣ retourner amis avec avatar + statut
		return friends.map(f => ({
			id: f.id,
			alias: f.alias,
			avatar: f.avatar,
			is_online: statusMap.get(f.id) || false
		}));
	});

	// --- Ajouter un ami ---
	fastify.post("/friends/add", async (request, reply) => {
		try {
			await request.jwtVerify();
		} catch (err) {
			return reply.status(401).send({ error: "Not authenticated" });
		}
		const userId = (request.user as any)?.sub;
		if (!userId) return reply.status(401).send({ error: "Not authenticated" });

		const { friendAlias } = request.body as { friendAlias?: string };
		
		console.log("👥 Adding friend:", { userId, friendAlias, bodyReceived: request.body });
		
		if (!friendAlias)
			return reply.status(400).send({ error: "Alias is required" });

		// 1️⃣ récupérer l'utilisateur cible
		const friendUser = db
			.prepare("SELECT id, alias, avatar FROM users WHERE alias = ?")
			.get(friendAlias) as { id: number; alias: string; avatar: string | null } | undefined;

		console.log("🔍 Search result for alias:", friendAlias, "=>", friendUser);

		if (!friendUser) {
			return reply.status(404).send({ error: "User not found" });
		}

		// 2️⃣ créer la relation
		const relation = addFriend(userId, friendUser.id);
		if (!relation) {
			return reply.status(409).send({ error: "Already friends or invalid" });
		}

		// 3️⃣ retourner DIRECTEMENT l'ami (pas la relation)
		return {
			id: friendUser.id,
			alias: friendUser.alias,
			avatar: friendUser.avatar,
			is_online: false, // par défaut à false, sera récupéré lors du prochain GET /friends
		};
	});

	// --- Supprimer un ami ---
	fastify.delete("/friends/remove", async (request, reply) => {
		try {
			await request.jwtVerify();
		} catch (err) {
			return reply.status(401).send({ error: "Not authenticated" });
		}
		const userId = (request.user as any)?.sub;
		if (!userId) return reply.status(401).send({ error: "Not authenticated" });

		const { friendId } = request.body as { friendId?: number };

		if (!friendId || isNaN(Number(friendId))) {
			return reply.status(400).send({ error: "Invalid friendId" });
		}

		removeFriend(userId, Number(friendId));

		return { ok: true };
	});
}

export { friendsRoutes };
