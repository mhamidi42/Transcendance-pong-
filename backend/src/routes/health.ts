import { FastifyInstance } from "fastify";
import { checkDatabase } from "../services/health";

export async function healthRoutes(fastify: FastifyInstance) {
    fastify.get("/health", async () => {
        return checkDatabase();
    });
}
