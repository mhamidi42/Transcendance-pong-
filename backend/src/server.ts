
import dotenv from "dotenv";

dotenv.config();

console.log("GITHUB_CLIENT_ID =", process.env.GITHUB_CLIENT_ID);

import Fastify from "fastify";
import cors from "@fastify/cors";
import { healthRoutes } from "./routes/health";
import { usersRoutes } from "./routes/users";
import { authRoutes } from "./routes/auth";
import { tournamentsRoutes } from "./routes/tournaments";
import { matchesRoutes } from "./routes/matches";
import { authPlugin } from "./plugin/middeware.js";
import cookie from "@fastify/cookie";
//import session from "@fastify/session";
import fastifyStatic from "@fastify/static";
import fastifyMultipart from "@fastify/multipart";
import path from "path";
import { initWebSocketServer } from "./websocket/wsServer.js";
import jwt from "@fastify/jwt";
import { friendsRoutes } from "./routes/friends";
import os from "os";

const fastify = Fastify({
	logger: true
});

async function startServer() {
	try {
		// ADD CORS FIRST
		// Permet au frontend localhost:8080 de communiquer avec le backend
		await fastify.register(cors, {
			origin: true, // Accepte toutes les origines en dev (http et https)
			credentials: true // CRITICAL for cookies/sessions
		});

		// 2️⃣ Form body parser
		// Permet de lire application/x-www-form-urlencoded
		await fastify.register(import('@fastify/formbody'));

		// 3️⃣ Cookies & session
		await fastify.register(cookie);
		//await fastify.register(session, {
		//	secret: "a-very-long-secret-key-at-least-32-characters-long-change-in-prod", // CHANGE en prod
		//	cookie: {
		//		secure: false, // true si HTTPS
		//		httpOnly: true,
		//		sameSite: 'lax',
		//	},
		//	saveUninitialized: false,
		//});
		await fastify.register(jwt, {
			secret: process.env.JWT_SECRET || "dev-secret",
			cookie: {
			cookieName: "access-token",
			signed: false,
			}});
		// 5️⃣ File uploads (avatars)
		await fastify.register(fastifyMultipart, {
			limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
		});
		// 6️⃣ Static files (avatars)
		// Nous plaçons 'uploads' à la racine backend pour compatibilité dev/prod/Docker
		await fastify.register(fastifyStatic, {
			root: path.join(process.cwd(), "uploads"),
			prefix: "/uploads/", // /uploads/avatars/default.png
		});

		// 7️⃣ Routes principales
		await healthRoutes(fastify);
		await usersRoutes(fastify);
		await authRoutes(fastify);
		await tournamentsRoutes(fastify);
		await matchesRoutes(fastify);
		await friendsRoutes(fastify);
		
		fastify.get("/server-info", async (request, reply) =>
		{
			const hostIp = process.env.HOST_IP;

			if (!hostIp) {
				return reply.status(500).send({
					error: "HOST_IP not defined"
				});
			}

			return {
				ip: hostIp
			};
		});

		await fastify.listen({ port: 3000, host: "0.0.0.0" });
		initWebSocketServer(fastify.server);
		console.log("Server is running on http://localhost:3000");

		// 8️⃣ Démarrage serveur
	} catch (error) {
		fastify.log.error(error);
		process.exit(1);
	}
}

startServer();

