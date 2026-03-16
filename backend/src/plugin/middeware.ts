import { FastifyInstance } from "fastify";

export async function authPlugin(fastify: FastifyInstance) {
	fastify.addHook("preHandler", async (req, reply) => {
		const publicRoutes = [
			"/auth/login",
			"/api/auth/login",
			"/auth/me",
			"/api/auth/me",
			"/health",
		];

		const url = req.raw.url ?? "";

		if (publicRoutes.some(route => url.startsWith(route))) {
			return;
		}
		try {
			await req.jwtVerify();
		}
		catch{
			return reply.status(401).send({ error: "Not authenticated" });
		}
		const step = (req.user as any)?.step;
		if (step === "2fa-setup" && !url.startsWith("/2fa-setup")) {
			return reply.status(403).send({ error: "2FA setup required" });
		}
	});
}
