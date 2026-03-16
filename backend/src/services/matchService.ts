import { db } from "../db/sqlite";
import { type UserResponse, MatchInfoResponse, MatchResponse } from "../models/responseModels.js";

function getMatchInfo(matchId: number): MatchInfoResponse { 
    const stmt = db.prepare(`
        SELECT
            m.id AS matchId,
            m.score_player1 AS score1,
            m.score_player2 AS score2,
            m.id_player1,
            m.id_player2,
            u1.alias AS name_player1,
            u2.alias AS name_player2,
			m.winner_alias,
			m.loser_alias
        FROM matches m
        LEFT JOIN users u1 ON u1.id = m.id_player1
        LEFT JOIN users u2 ON u2.id = m.id_player2
        WHERE m.id = ?
    `);
    const res = stmt.get(matchId) as MatchInfoResponse | undefined;
    if (!res){
        throw new Error("Match not found");
    }
    return res;
}

function createMatch(tournamentId?: number): { id: number } {
	const result = db.prepare(`
		INSERT INTO matches (tournament_id, created_at, max_score)
		VALUES (?, datetime('now'), 3)
	`).run(tournamentId ?? null);

	return { id: Number(result.lastInsertRowid) };
}

function addPlayerToMatch(matchId: number, userId: number): void{
	const stmt = db.prepare(`
		INSERT OR IGNORE INTO match_players (match_id, user_id)
		VALUES (?, ?)
	`);
	stmt.run(matchId, userId);
	const stmt2 = db.prepare(`
		UPDATE matches SET id_player1 = CASE WHEN id_player1 IS NULL THEN ? ELSE id_player1 END,
		id_player2 = CASE WHEN id_player1 IS NOT NULL AND id_player2 IS NULL AND id_player1 != ? THEN ? ELSE id_player2 END
		WHERE id = ?
	`);
	stmt2.run(userId, userId, userId, matchId);
}

function startMatch(matchId:number): void {
	const stmt = db.prepare(`
		UPDATE matches
		SET status = 'running'
		WHERE id = ?
	`);
	stmt.run(matchId);
}

function finishMatch(matchId:number): void {
	const stmt = db.prepare(`
		UPDATE matches
		SET status = 'finished'
		WHERE id = ?
		`);
	stmt.run(matchId);
}

function deleteMatch(matchId: number): void {
	const stmt = db.prepare(`
		DELETE FROM matches WHERE id = ? AND status != 'finished'
	`);
	stmt.run(matchId);
}

export { createMatch, getMatchInfo, startMatch, finishMatch, addPlayerToMatch, deleteMatch };
