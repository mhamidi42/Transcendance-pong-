import { db } from "../db/sqlite";
import { TournamentPlayerResponse } from "../models/responseModels.js";

function addPlayerToTournament(tournamentId: number, userId: number): void {
	const stmt = db.prepare(`
		INSERT INTO tournament_players (tournament_id, user_id, alias)
		SELECT ?, ?, u.alias
		FROM users u
		WHERE u.id = ?
	`);
	stmt.run(tournamentId, userId, userId);
}

function getPlayersForTournament(tournamentId: number): number[] {
	const stmt = db.prepare(`
		SELECT user_id
		FROM tournament_players
		WHERE tournament_id = ?
	`);
	return stmt.all(tournamentId).map((row: any) => row.user_id);
}

function getPointPerPlayer(tournamentId: number): TournamentPlayerResponse[]{
	const stmt = db.prepare(`
		SELECT 
			tp.alias, 
			tp.points,
			COUNT(CASE WHEN m.status = 'finished' THEN 1 END) as nb_games
		FROM tournament_players tp
		LEFT JOIN matches m ON m.tournament_id = tp.tournament_id 
			AND (m.id_player1 = tp.user_id OR m.id_player2 = tp.user_id)
		WHERE tp.tournament_id = ?
		GROUP BY tp.alias, tp.points
	`);
	return stmt.all(tournamentId) as unknown as TournamentPlayerResponse[];
}

type AliasResult = { alias: string };

function getAliasTournament(tournamentId: number, userId: number): { alias: string } | null {
	const stmt = db.prepare(`
		SELECT alias
		FROM tournament_players
		WHERE tournament_id = ? AND user_id = ?
	`);
	const result = stmt.get(tournamentId, userId) as AliasResult | undefined;
	return result ? { alias: result.alias } : null;
}

function updateAliasTournament(tournamentId: number, userId: number, alias: string): void {
	const stmt = db.prepare(`
		UPDATE tournament_players
		SET alias = ?
		WHERE tournament_id = ? AND user_id = ?
	`);
	stmt.run(alias, tournamentId, userId);
}

export { addPlayerToTournament, getPlayersForTournament, getPointPerPlayer, getAliasTournament, updateAliasTournament };