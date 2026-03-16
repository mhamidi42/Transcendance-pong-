import { db } from "../db/sqlite";
import bcrypt from "bcryptjs";
import { UserResponse } from "../models/responseModels";
import speakeasy from "speakeasy";

type dbUser = {
	id: number;
	alias: string;
	email: string;
	avatar: string | null;
};

type UserAuth = dbUser & {
    password_hash: string;
	twoFactorEnabled?: boolean;
	twoFactorConfirmed?: boolean;
};

function createGithubUser(oauthId: string, alias: string, email: string | null, avatar: string | null):  UserResponse{
	const stmt = db.prepare(`
		INSERT INTO users (oauth_id, alias, email, avatar)
		VALUES (?, ?, ?, ?)`);
	const result = stmt.run(oauthId, alias, email, avatar);
	
	const userId = result.lastInsertRowid as number;

	// Créer les settings par défaut pour ce nouvel utilisateur GitHub
	const settingsStmt = db.prepare(`
		INSERT INTO pong_settings (
			userId, difficulty, ballSpeed, paddleSpeed,
			backgroundColor, ballColor, paddleColor,
			player1Up, player1Down, player2Up, player2Down,
			maxScore
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`);
	
	settingsStmt.run(
		userId,
		'medium',      // difficulty
		5,             // ballSpeed
		7,             // paddleSpeed
		'#000000',     // backgroundColor
		'#ffffff',     // ballColor
		'#ffffff',     // paddleColor
		'w',           // player1Up
		's',           // player1Down
		'ArrowUp',     // player2Up
		'ArrowDown',   // player2Down
		5              // maxScore
	);
	
	return {
		id: userId,
		alias,
		email,
		avatar
	}
}

function createUser(alias: string, email: string | null, password: string | null, twofa: boolean): UserResponse {
	const passwordHash = bcrypt.hashSync(password ?? "", 10);
	
	const stmt = db.prepare(`
		INSERT INTO users (alias, email, password_hash, twoFactorEnabled)
		VALUES (?, ?, ?, ?)`);
	const result = stmt.run(alias, email, passwordHash, twofa ? 1 : 0);
	
	const userId = result.lastInsertRowid as number;

	// Créer les settings par défaut pour ce nouvel utilisateur
	const settingsStmt = db.prepare(`
		INSERT INTO pong_settings (
			userId, difficulty, ballSpeed, paddleSpeed,
			backgroundColor, ballColor, paddleColor,
			player1Up, player1Down, player2Up, player2Down,
			maxScore
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`);
	
	settingsStmt.run(
		userId,
		'medium',      // difficulty
		5,             // ballSpeed
		7,             // paddleSpeed
		'#000000',     // backgroundColor
		'#ffffff',     // ballColor
		'#ffffff',     // paddleColor
		'w',           // player1Up
		's',           // player1Down
		'ArrowUp',     // player2Up
		'ArrowDown',   // player2Down
		5              // maxScore
	);	
	return {
		id: userId,
		alias,
		email,
		avatar: "/uploads/avatars/default.png",
	};
}

function updateUserAlias(userId: number, newAlias: string) {
	// Run the SQL query to update the user's alias
	const stmt = db.prepare("UPDATE users SET alias = ? WHERE id = ?");
	stmt.run(newAlias, userId);

	// Fetch and return the updated user from the database
	return getUser(userId);
}

function updateUserAvatar(userId: number, avatarPath: string) {
	const stmt = db.prepare(`
		UPDATE users
		SET avatar = ?
		WHERE id = ?
	`);
	stmt.run(avatarPath, userId);

	return getUser(userId);
}



function deleteDefaultUser() {
	const stmt = db.prepare(
		`DELETE FROM users WHERE alias LIKE 'Invité%' OR alias LIKE 'Invite%'`
	);
	stmt.run();
}

function anonymizeUser(userId: number) {
	try {
		const anonymousAlias = "anonymous_" + userId;
		const anonymousEmail = "anonymous_" + userId + "@mail.fr";
		const defaultAvatarPath = "/uploads/avatars/default.png";

		const stmt = db.prepare(`
			UPDATE users
			SET alias = ?, email = ?, avatar = ?
			WHERE id = ?
		`);

		stmt.run(anonymousAlias, anonymousEmail, defaultAvatarPath, userId);
		const updatedUser = getUser(userId);
		return updatedUser;

	} catch (error: any) {
		throw error;
	}
}

function deleteUser(userId: number) {
	try {
		const deleteTransaction = db.transaction(() => {
			// Supprimer les liens match ↔ user
			db.prepare("DELETE FROM match_players WHERE user_id = ?").run(userId);

			// Supprimer les inscriptions aux tournois
			db.prepare("DELETE FROM tournament_players WHERE user_id = ?").run(userId);

			// Supprimer les paramètres utilisateur
			db.prepare("DELETE FROM pong_settings WHERE userId = ?").run(userId);

			// Supprimer l'utilisateur
			db.prepare("DELETE FROM users WHERE id = ?").run(userId);
		});

		deleteTransaction();
	} catch (error: any) {
		throw error;
	}
}

function checkUserOauth(oauthId: string): boolean {
	const stmt = db.prepare(`SELECT COUNT(*) as count FROM users WHERE oauth_id = ?`);
	const result = stmt.get(oauthId) as { count: number };
	return result.count > 0;
}

function searchGithubUser(oauthId: string): number {
	const stmt = db.prepare(`SELECT id FROM users WHERE oauth_id = ?`);
	const result = stmt.get(oauthId) as { id: number };
	return result.id;
}

function getAllUsers(): dbUser[] {
	const stmt = db.prepare(`SELECT id, alias, email, avatar FROM users`);

	return stmt.all() as dbUser[];
}

function getUser(id: number): dbUser {
	const stmt = db.prepare(`SELECT id, alias, email, avatar FROM users WHERE id = ?`);
	return stmt.get(id) as dbUser;
}

function getUserByEmail(email: string): UserAuth | undefined {
	const stmt = db.prepare(`SELECT * FROM users WHERE email = ?`);
	return stmt.get(email) as UserAuth | undefined;
}

function saveSecrets2FA(userId: number, secret: string) {
	const stmt = db.prepare(`
		UPDATE users
		SET twoFactorSecret = ? 
		WHERE id = ?`);
	stmt.run(secret, userId);
}

function verify2fACode(userId: number, code: string): boolean {
	const stmt = db.prepare('SELECT twoFactorSecret FROM users WHERE id = ?');
	const result = stmt.get(userId) as { twoFactorSecret: string };
	if (!result || !result.twoFactorSecret) {
		return false;
	}
	const verified = speakeasy.totp.verify({
		secret: result.twoFactorSecret,
		encoding: 'base32',
		token: code,
	});
	if (verified){
		const stmt2 = db.prepare(`
			UPDATE users
			SET twoFactorSecret = NULL, twoFactorConfirmed = 1
			WHERE id = ?`);
		stmt2.run(userId);
	}
	return verified;
}

export { createUser, getAllUsers, anonymizeUser, deleteUser, 
	getUser, getUserByEmail, updateUserAlias, deleteDefaultUser, 
	checkUserOauth, updateUserAvatar, createGithubUser, searchGithubUser, saveSecrets2FA, verify2fACode };
