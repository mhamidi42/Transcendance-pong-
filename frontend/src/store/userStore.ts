
// User Store - Centralized user authentication state management

// This module provides a single source of truth for the currently logged-in user.
// Instead of each page making its own API call to check authentication,
// we load the user once and store it here for the entire application to access.

export type User = {
	id: number;
	alias: string;
	email: string | null;
	avatar: string | null;
};


// Global state: stores the currently authenticated user
// - null = user is not logged in (or hasn't been loaded yet)
// - User object = user is logged in

export let currentUser: User | null = null;



// Loads the current user from the backend API

// This function should be called:
// - When the app first loads (in index.ts)
// - After successful login
// - After successful registration

// returns The authenticated user object, or null if not logged in

// How it works:
// 1. Makes a GET request to /api/auth/me
// 2. Backend checks the session cookie to identify the user
// 3. If valid session exists, returns user data and we cache it
// 4. If no session or invalid, we set currentUser to null

export async function loadCurrentUser(): Promise<User | null> {
	try {
		// credentials: "include" is CRITICAL - it sends session cookies to the backend
		const res = await fetch("/api/auth/me", {
		credentials: "include"
		});

		// If response is not OK (401 Unauthorized, 500 error, etc.)
		if (!res.ok) {
			currentUser = null;
			return null;
		}
		// Parse the JSON response containing user data
		const data = await res.json();
		// Cache the user data in our global state
		currentUser = data;
		// Return the user for immediate use by the caller
		return currentUser;
	}
	catch {
		currentUser = null;
		return null;
	}
}

export function getCurrentUser(): User | null {
	return currentUser;
}

export function setCurrentUser(user: User | null) {
    currentUser = user;
}

export async function logout() {
	await fetch("/api/auth/logout", {
		method: "POST",
		credentials: "include"
	});

	currentUser = null;
}