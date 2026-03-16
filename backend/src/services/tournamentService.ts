import { db } from "../db/sqlite";
import { TournamentResponse, TournamentPlayerResponse } from "../models/responseModels.js";
import { addPlayerToMatch, createMatch } from "./matchService";

function createTournament(): TournamentResponse {
	const stmt = db.prepare(`
		INSERT INTO tournaments (created_at)
		VALUES (datetime('now'))
	`);
	const result = stmt.run();
	return {
		id: result.lastInsertRowid as number
	}
}

type RowResponse = {
	id: number;
}

function getTournamentNumber(tournamentId: number): TournamentResponse{
	const stmt = db.prepare(`
		SELECT COUNT(id) FROM matches WHERE tournament_id = ?
		`);
	const result = stmt.get(tournamentId) as RowResponse;
	return {
		id: result.id
	}
}


function getNextMatch(tournamentId: number): TournamentResponse {
	const stmt = db.prepare(`
		SELECT id FROM matches
		WHERE tournament_id = ? AND status = 'pending'
		ORDER BY random()
		LIMIT 1
	`);
	const result = stmt.get(tournamentId) as RowResponse;
	return {
		id: result.id
	}
}

function abortTournament(tournamentId: number): void {
	const stmt = db.prepare(`
		UPDATE tournaments SET aborted = 1 WHERE id = ?
	`);
	stmt.run(tournamentId);
	const stmt2 = db.prepare(`
		DELETE FROM matches WHERE tournament_id = ? AND status = 'pending' OR status = 'running'
	`);
	stmt2.run(tournamentId);
}

function generateMatchesForTournament(tournamentId: number, userIds: number[]): void {
	const totalPlayers = userIds.length;
	if (totalPlayers < 2) {
		return;
	}
	for (let i = 0; i < totalPlayers; i = i + 1) {
		for (let j = i + 1; j < totalPlayers; j = j + 1) {
			const matchId = createMatch(tournamentId);
			addPlayerToMatch(matchId.id, userIds[i]);
			addPlayerToMatch(matchId.id, userIds[j]);
		}
	}
}

function addPointsToUserInTournament(tournamentId: number, userId: number, points: number): void {
	const stmt = db.prepare(`
		UPDATE tournament_players SET points = points + ?
		WHERE tournament_id = ? AND user_id = ?
	`);
	stmt.run(points, tournamentId, userId);
}

type StatusResponse = {
	count: number;
}

function checkStatus(tournamentId: number): number {
	const stmt = db.prepare(`
		SELECT COUNT(*) as count FROM matches WHERE status = 'pending' AND tournament_id = ?
	`);
	const result = stmt.get(tournamentId) as StatusResponse;
	return result.count;
}

export { createTournament, getNextMatch, generateMatchesForTournament, getTournamentNumber, abortTournament, addPointsToUserInTournament, checkStatus };
