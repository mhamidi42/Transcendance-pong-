import { db } from "../db/sqlite";
import { UserMatch } from "../models/responseModels";

function getMatchesForUser(userId: number): UserMatch[] {
	const stmt = db.prepare(`
		SELECT
			m.id AS match_id,
			m.tournament_id,
			m.created_at
		FROM matches m
		INNER JOIN match_players mp
			ON mp.match_id = m.id
		WHERE mp.user_id = ? AND m.status = 'finished'
		ORDER BY m.created_at ASC
	`);
	return stmt.all(userId) as UserMatch[];
}

//function getMatchesForUser(userId: number): Promise<UserMatch[]> {
//    return new Promise((resolve, reject) => {
//        const query = `
//            SELECT
//                m.id AS match_id,
//                m.tournament_id,
//                m.created_at
//            FROM matches m
//            INNER JOIN match_players mp
//                ON mp.match_id = m.id
//            WHERE mp.user_id = ?
//            ORDER BY m.created_at ASC
//        `;

//        db.all(query, [userId], (error, rows) => {
//            if (error) {
//                reject(error);
//            } else {
//                resolve(rows as UserMatch[]);
//            }
//        });
//    });
//}

export { getMatchesForUser };
