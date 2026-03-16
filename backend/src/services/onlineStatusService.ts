import { db } from "../db/sqlite";


// On utilise un Set pour stocker les userId des utilisateurs connectés.
const onlineUsers = new Set<number>();

export function setUserOnline(userId: number): void {
	onlineUsers.add(userId);

	// Update database
	const stmt = db.prepare(`
		UPDATE users 
		SET is_online = 1, last_seen = CURRENT_TIMESTAMP
		WHERE id = ?
	`);
	stmt.run(userId);
}

export function setUserOffline(userId: number): void {
	onlineUsers.delete(userId);

	// Update database
	const stmt = db.prepare(`
		UPDATE users 
		SET is_online = 0, last_seen = CURRENT_TIMESTAMP
		WHERE id = ?
	`);
	stmt.run(userId);
}

export function isUserOnline(userId: number): boolean {
	return onlineUsers.has(userId);
}

export function getOnlineUsers(): number[] {
	return Array.from(onlineUsers);
}

export function getOnlineStatus(userIds: number[]): Map<number, boolean> {
	const statusMap = new Map<number, boolean>();
	for (const userId of userIds) {
		statusMap.set(userId, onlineUsers.has(userId));
	}
	return statusMap;
}
