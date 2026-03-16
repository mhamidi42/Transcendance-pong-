

export type Friend = {
  id: number;
  friendAlias: string;
  avatar: string | null;
  is_online: boolean;
};


let friends: Friend[] = [];

export function setFriends(newFriends: Friend[]) {
	friends = newFriends;
}

// mettre un ami en ligne
export function setFriendOnline(friendId: number) {
  friends = friends.map(f =>
    f.id === friendId ? { ...f, is_online: true } : f
  );
}

// mettre un ami hors ligne
export function setFriendOffline(friendId: number) {
  friends = friends.map(f =>
    f.id === friendId ? { ...f, is_online: false } : f
  );
}


export function getFriendsList() {
	return friends;
}

// Récupérer tous les amis depuis le backend
export async function fetchFriends(): Promise<Friend[]> {
	try {
		const res = await fetch("/api/friends/list", {
			method: "GET",
			credentials: "include" 
		});
		
		 if (!res.ok) return [];

		// 👇 backend = number
		const backendData = await res.json() as Array<{
			id: number;
			alias: string;
			avatar: string | null;
			is_online: number;
		}>;

		// 👇 conversion backend -> frontend
		const data: Friend[] = backendData.map(f => ({
			id: f.id,
			friendAlias: f.alias,
			avatar: f.avatar,
			is_online: !!f.is_online
		}));

		setFriends(data);
		return data;

	} catch (err) {
		console.error("Failed to fetch friends:", err);
		return [];
	}
}

// Ajouter un ami via le backend (par alias)
export async function addFriendByAlias(friendAlias: string): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch("/api/friends/add", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ friendAlias }),
			credentials: "include"
		});
		if (res.ok) {
			await fetchFriends();// Refresh friends list
			return { success: true };
		}
		
		const error = await res.json();
			return { success: false, error: error.error || "Failed to add friend" };
	} catch (err) {
		console.error("Failed to add friend:", err);
		return { success: false, error: "Network error" };
	}
}


// Supprimer un ami via le backend
export async function removeFriendById(friendId: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/friends/remove`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId }),
      credentials: "include"
    });
    
    if (res.ok) {
      // Update local state
      friends = friends.filter(f => f.id !== friendId);
      return true;
    }
    
    return false;
  } catch (err) {
    console.error("Failed to remove friend:", err);
    return false;
  }
}