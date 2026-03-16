import { type Page } from "../models/pageType.js";
import { navigateTo } from "../router.js";
import { currentUser } from "../store/userStore.js";
import {
	fetchFriends, addFriendByAlias, removeFriendById, getFriendsList, setFriendOnline, setFriendOffline, type Friend,
} from "../store/friendStore.js";

export const FriendsPage: Page = {
	render(): string {
		return `
		<div class="friends-page">
			<h1>Friends</h1>
			
			<div class="add-friend">
			<input type="text" id="friendAlias" placeholder="Enter friend's alias" />
			<button id="addFriendBtn">Add Friend</button>
			<span id="message"></span>
			</div>

			<div id="friendsList">Loading...</div>
		</div>
		`;
	},

	async onMount() {
		if (!currentUser) {
			navigateTo("/login");
			return;
		}

		const friendsList = document.getElementById("friendsList");
		const aliasInput = document.getElementById("friendAlias") as HTMLInputElement;
		const addBtn = document.getElementById("addFriendBtn");
		const message = document.getElementById("message");

		if (!friendsList || !aliasInput || !addBtn) return;

		// --- Affichage de la liste ---
		const displayFriends = () => {
			const friends = getFriendsList(); // prend directement le store local
			if (friends.length === 0) {
				friendsList.innerHTML = "<p>No friends yet. Add some by their alias!</p>";
				return;
			}
			friendsList.innerHTML = friends
				.map((friend: Friend) => {
					const avatarUrl = friend.avatar
						? `/uploads/avatars/${friend.avatar}`
						: `/uploads/avatars/default.png`;

					const onlineDot = friend.is_online
						? '<span class="online-dot text-green-500">●</span>'
						: '<span class="online-dot text-red-500">●</span>';

					return `
					<div class="friend-card">
					<img
						src="${avatarUrl}"
						alt="${friend.friendAlias}"
						class="w-20 h-20 rounded-full object-cover"
					/>
					<span class="friend-alias">${friend.friendAlias}</span>
					${onlineDot}
					<button
						class="remove-btn"
						data-friend-id="${friend.id}"
					>
						Remove
					</button>
				</div>
				.
				`;
				})
				.join("");
		};

		// Ajouter un ami
		addBtn.addEventListener("click", async () => {
			const alias = aliasInput.value.trim();
			if (!alias) {
				if (message) message.textContent = "Please enter an alias";
				return;
			}

			const result = await addFriendByAlias(alias);

			if (result.success) {
				aliasInput.value = "";
				if (message) message.textContent = "✓ Friend added!";
				displayFriends();
				setTimeout(() => {
					if (message) message.textContent = "";
				}, 3000);
			} else {
				if (message) message.textContent = `${result.error}`;
			}
		});

		// Event delegation pour remove
		friendsList.addEventListener("click", async (e) => {
			const target = e.target as HTMLElement;
			if (!target.classList.contains("remove-btn")) return;

			const friendId = target.dataset.friendId;
			if (!friendId) return;

			if (!confirm("Remove this friend?")) return;

			const success = await removeFriendById(Number(friendId));
			if (success) displayFriends();
		});

		// --- Chargement initial depuis backend ---
		await fetchFriends();
		displayFriends();
	}
};