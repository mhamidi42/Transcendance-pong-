import { db } from "../db/sqlite";
import type { matchScore } from "../models/matchScore";

function addScore(matchId: number, score: matchScore): void {
	const stmt = db.prepare(`
		UPDATE matches
		SET score_player1 = ?, score_player2 = ?, winner_alias = ?, loser_alias = ?, winner_id = ?
		WHERE id = ?
	`);
	stmt.run(score.score1, score.score2, score.winner_alias, score.loser_alias, score.winner_id, matchId);
}

type ScoreRow = {
    score1: number;
	score2: number;
};

function getScoreByMatch(matchId: number): ScoreRow {
	const stmt = db.prepare(`
		SELECT score_player1 AS score1, score_player2 AS score2
		FROM matches
		WHERE id = ?
	`);

	const row = stmt.get(matchId) as ScoreRow | undefined;

	if (!row) {
		throw new Error("Score not found");
	}
	return row;
}

export { addScore, getScoreByMatch };
