import { FastifyInstance } from "fastify";
import { createTournament, getNextMatch, generateMatchesForTournament, getTournamentNumber, abortTournament, addPointsToUserInTournament, checkStatus } from "../services/tournamentService";
import { addPlayerToTournament, getPlayersForTournament, getPointPerPlayer, getAliasTournament, updateAliasTournament } from "../services/tournamentPlayerService";
import { TournamentResponse } from "../models/responseModels.js";
import { abort } from "process";
import { get } from "http";

async function tournamentsRoutes(fastify: FastifyInstance) {

    fastify.post("/tournaments", async (request, reply) => {
        try {
            const tournament = createTournament();
            reply.status(201);
            return tournament;
        } catch (error) {
            reply.status(500);
            return { error: "failed to create tournament" };
        }
    });

    fastify.post("/tournaments/:id/players", async (request, reply) => {
        const params = request.params as { id: string };
        const body = request.body as { userId?: number };

        if (body.userId === undefined) {
            reply.status(400);
            return { error: "userId is required" };
        }

        try {
            addPlayerToTournament(Number(params.id), body.userId);
            reply.status(201);
            return { ok: true };
        } catch (error) {
            reply.status(500);
            return { error: "failed to add player to tournament" };
        }
    });

    fastify.post("/tournaments/:id/generate-matches", async (request, reply) => {
        const params = request.params as { id: string };
        const tournamentId = Number(params.id);

        try {
            const userIds = getPlayersForTournament(tournamentId);

            generateMatchesForTournament(tournamentId, userIds);

            return { ok: true };
        } catch (error) {
            reply.status(500);
            return { error: "failed to generate matches" };
        }
    });

	fastify.get("/matches/next/:tournamentId", (request, reply) => {
		const params = request.params as { tournamentId: string };
		if (!params.tournamentId) {
			reply.status(400);
			return { error: "Tournament ID is required" };
		}
		try {
			const res: TournamentResponse = getNextMatch(Number(params.tournamentId));
			return res;
		}
		catch (error) {
			console.error("Failed to get next match:", error);
			reply.status(500);
			return { error: "failed to get next match" };
		}
	});

	fastify.get("/tournaments/:id/number", (request, reply) => {
		const params = request.params as { id: string };
		if (!params.id) {
			reply.status(400);
			return { error: "Tournament ID is required" };
		}
		try {
			const res: TournamentResponse = getTournamentNumber(Number(params.id));
			return res;
		}
		catch (error) {
			console.error("Failed to get tournament number:", error);
			reply.status(500);
			return { error: "failed to get tournament number" };
		}
	});

	fastify.post("/tournaments/:id/aborted", (request, reply) => {
		const params = request.params as { id: string };
		try{
			abortTournament(Number(params.id));
			reply.status(201);
			return { ok: true };
		}
		catch (error) {
			console.error("Failed to abort tournament:", error);
			reply.status(500);
			return { error: "failed to abort tournament" };
		}
	});

	fastify.post("/tournament/:tournamentId/:userId/points", (request, reply) => {
		const params = request.params as { tournamentId: string; userId: string };
		try {
			addPointsToUserInTournament(Number(params.tournamentId), Number(params.userId), 3);
			reply.status(201);
			return { ok: true };
		}
		catch (error) {
			console.error("Failed to add points to player:", error);
			reply.status(500);
			return { error: "failed to add points to player" };
		}
	});

	fastify.get("/tournaments/:id/points", (request, reply) => {
		const params = request.params as { id: string };
		try {
			const res = getPointPerPlayer(Number(params.id));
			return res;
		}
		catch (error) {
			console.error("Failed to get player points:", error);
			reply.status(500);
			return { error: "failed to get player points" };
		}
	});

	fastify.get(`/tournaments/:id/status`, (request, reply) => {
		const params = request.params as { id: string };
		try {
			if (checkStatus(Number(params.id)) == 0) {
				return { finished: true };
			} else {
				return { finished: false };
			}
		}
		catch (error) {
			console.error("Failed to get tournament status:", error);
			reply.status(500);
			return { error: "failed to get tournament status" };
		}
	});

	fastify.get(`/tournaments/:tournamentId/:userId/getalias`, (request, reply) => {
		const params = request.params as { tournamentId: string; userId: string };
		try {
			const resp = getAliasTournament(Number(params.tournamentId), Number(params.userId));
			reply.status(201);
			return resp;
		}
		catch (error) {
			console.error("Failed to get alias:", error);
			reply.status(500);
			return { error: "failed to get alias" };
		}	
	});

	fastify.post(`/tournaments/:tournamentId/:userId/setalias`, (request, reply) => {
		const params = request.params as { tournamentId: string; userId: string };
		const body = request.body as { alias?: string };
		if (body.alias === undefined) {
			reply.status(400);
			return { error: "alias is required" };
		}
		try {
			updateAliasTournament(Number(params.tournamentId), Number(params.userId), body.alias);
			reply.status(201);
			return { ok: true };
		}
		catch (error) {
			console.error("Failed to set alias:", error);
			reply.status(500);
			return { error: "failed to set alias" };
		}
	});
}


export { tournamentsRoutes };
