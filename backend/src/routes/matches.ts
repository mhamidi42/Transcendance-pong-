import { FastifyInstance } from "fastify";
import { addScore, getScoreByMatch } from "../services/scoreService";
import { createMatch, getMatchInfo, startMatch, finishMatch, addPlayerToMatch, deleteMatch } from "../services/matchService";
import { get } from "http";
import { match } from "assert";
import type { matchScore } from "../models/matchScore";

async function matchesRoutes(fastify: FastifyInstance) {

	fastify.post("/matches", (request, reply) => {
		try {
			const matchId = createMatch();
			return matchId;
		} catch (error) {
			console.error("Failed to create match:", error);
			reply.status(500);
			return { error: "failed to create match" };
		}
	});

	fastify.post("/matches/:id/start", (request, reply) => {
		try {
			const matchId = Number((request.params as { id: string }).id);
			startMatch(matchId);
			return { ok: true };
		}
		catch (error) {
			console.error("Failed to start match:", error);
			reply.status(500);
			return { error: "failed to start match" };
		}
	});

	fastify.post("/matches/:id/finish", (request, reply) => {
		try {
			const matchId = Number((request.params as { id: string}).id);
			finishMatch(matchId);
			return { ok: true };
		}
		catch (error) {
			console.error("Failed to finish match:", error);
			reply.status(500);
			return { error: "failed to finish match" };
		}
	});

	fastify.get("/matches/:id", (request, reply) => {
		const params = request.params as { id: string };
		if (!params.id) {
			reply.status(400);
			return { error: "Match ID is required" };
		}
		try {
			const res = getMatchInfo(Number(params.id));
			return res;
		}
		catch (error) {
			console.error("Failed to get match info:", error);
			reply.status(500);
			return { error: "failed to get match info" };
		}
	});

    fastify.post("/matches/:id/score", (request, reply) => {
        const params = request.params as { id: string };
        const body = request.body as { score1?: number; score2?: number; winner_alias?: string; loser_alias?: string; winner_id?: number };

        if (body.score1 === undefined || body.score2 === undefined) {
            reply.status(400);
            return { error: "score1 and score2 are required" };
        }

        try {
            addScore(Number(params.id), body as matchScore);
            reply.status(201);
            return { ok: true };
        } catch (error) {
            reply.status(500);
            return { error: "failed to add score" };
        }
    });

	fastify.post("/matches/:id/:player", (request, reply) => {
		const params = request.params as { id: string; player: string };
		const matchId = Number(params.id);
		const userId = Number(params.player);
		try {
			addPlayerToMatch(matchId, userId);
			reply.status(201);
			return { ok: true };
		}
		catch (error) {	
			console.error("Failed to add player to match:", error);
			reply.status(500);
			return { error: "failed to add player to match" };
		}
	});

	fastify.delete("/matches/:id", (request, reply) => {
		const params = request.params as { id: string };
		const matchId = Number(params.id);
		try{
			deleteMatch(matchId);
			reply.status(200);
			return { ok: true };
		}
		catch (error) {
			console.error("Failed to delete match:", error);
			reply.status(500);
			return { error: "failed to delete match" };
		}
	});
}


export { matchesRoutes };
