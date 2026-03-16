import { db } from "../db/sqlite";
import { SettingsResponse } from "../models/responseModels";

type PongSettings = {
    difficulty: string;
    ballSpeed: number;
    paddleSpeed: number;
    backgroundColor: string;
    ballColor: string;
    paddleColor: string;
    player1Up: string;
    player1Down: string;
    player2Up: string;
    player2Down: string;
    maxScore: number;
    powerUp: boolean;
};

function getUserSettings(userId: number): PongSettings | null {
	const stmt = db.prepare(`
		SELECT
			difficulty,
			ballSpeed,
			paddleSpeed,
			backgroundColor,
			ballColor,
			paddleColor,
			player1Up,
			player1Down,
			player2Up,
			player2Down,
			maxScore,
            powerUp
		FROM pong_settings
		WHERE userId = ?
	`);
	return stmt.get(userId) as PongSettings | null;
}

function updateUserSettings(userId: number, settings: PongSettings): void {
	const stmt = db.prepare(`
		UPDATE pong_settings
		SET
			difficulty = ?,
			ballSpeed = ?,
			paddleSpeed = ?,
			backgroundColor = ?,
			ballColor = ?,
			paddleColor = ?,
			player1Up = ?,
			player1Down = ?,
			player2Up = ?,
			player2Down = ?,
			maxScore = ?,
            powerUp = ?
		WHERE userId = ?
	`);
	
	stmt.run(
		settings.difficulty,
		settings.ballSpeed,
		settings.paddleSpeed,
		settings.backgroundColor,
		settings.ballColor,
		settings.paddleColor,
		settings.player1Up,
		settings.player1Down,
		settings.player2Up,
		settings.player2Down,
		settings.maxScore,
        settings.powerUp ? 1 : 0,
		userId
	);
}

export { getUserSettings, updateUserSettings };
