import { db } from "../db/sqlite";


export type dbFriend = {
	id: number;	// l'id de la relation
	user_id: number;
	friend_id: number;
	created_at: string;
};


export type FriendWithDetails = {
  id: number;
  alias: string;
  avatar: string | null;
};

// --- Ajouter un ami ---
export function addFriend(userId: number, friendId: number): dbFriend | null {
	if (userId === friendId) return null; // impossible de s'ajouter soi-même

	try {
		const stmt = db.prepare(`
			INSERT INTO friends (user_id, friend_id)
			VALUES (?, ?)
		`);
		const result = stmt.run(userId, friendId);

		return {
			id: result.lastInsertRowid as number,
			user_id: userId,
			friend_id: friendId,
			created_at: new Date().toISOString(),
		};
	} catch (err: any) {
		// relation déjà existante
		if (err.message.includes("UNIQUE constraint failed")) {
			return null;
		}
		throw err;
	}
}

// --- Supprimer un ami ---
export function removeFriend(userId: number, friendId: number): boolean {
  const stmt = db.prepare(`
    DELETE FROM friends
    WHERE (user_id = ? AND friend_id = ?)
       OR (user_id = ? AND friend_id = ?)
  `);

  const result = stmt.run(userId, friendId, friendId, userId);
  return result.changes > 0;
}


// --- Lister tous les amis d'un utilisateur ---
export function getFriends(userId: number): FriendWithDetails[] {
  const stmt = db.prepare(`
    SELECT 
      u.id,
      u.alias,
      u.avatar
    FROM friends f
    JOIN users u ON u.id = f.friend_id
    WHERE f.user_id = ?
    
    UNION
    
    SELECT 
      u.id,
      u.alias,
      u.avatar
    FROM friends f
    JOIN users u ON u.id = f.user_id
    WHERE f.friend_id = ?
    
    ORDER BY alias ASC
  `);
  
  return stmt.all(userId, userId) as FriendWithDetails[];
}
