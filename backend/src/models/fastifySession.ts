import session from "@fastify/session";

declare module "@fastify/session" {
	interface FastifySessionObject {
		oauthState?: string;
		userId?: number;
	}
}
