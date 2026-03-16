import { HomePage } from "./_pages/home.js";
import { MatchPage } from "./_pages/match.js";
import { TournamentPage } from "./_pages/tournament.js";
import { LoginPage } from "./_pages/login.js";
import { RegisterPage } from "./_pages/register.js";
import { RgpdPage } from "./_pages/rgpd.js";
import { type Page } from "./models/pageType.js";
import { TwoFASetupPage } from "./_pages/2fa-setup.js";
import { MatchSetupPage } from "./_pages/match-setup.js";
import { getBackend } from "./communication/fetch.js";
import { StatsPage } from "./_pages/stats.js";
import { ProfilePage } from "./_pages/profile.js";
import { ErrorPages } from "./_pages/error.js";
import { logout } from "./store/userStore.js";
import { FriendsPage } from "./_pages/friends.js";


let currentPage: Page | null = null;

const routes: Record<string, Page> = {
	"/": HomePage,
	"/home": HomePage,
	"/tournament": TournamentPage,
	"/match": MatchPage,
	"/login": LoginPage,
	"/register": RegisterPage,
	"/match-setup": MatchSetupPage,
	"/stats": StatsPage,
	"/rgpd": RgpdPage,
	"/profile": ProfilePage,
	"/error_pages/": ErrorPages,
	"/friends": FriendsPage,
	"/2fa-setup": TwoFASetupPage,
}

function getRoute(pathname: string): Page | undefined {
	if (routes[pathname])
			return routes[pathname];
	return routes!["/error_pages/"];
}

const protectedRoutes = ["/", "/home", "/tournament", "/match", "/match-setup", "/stats", "/rgpd", "/profile", "/friends", "/2fa-setup"];

async function getMe(a2th: boolean) {
	if (!a2th){
		try {
			return await getBackend("/auth/me");
		} catch {
			return null;
		}
	}
	else{
		try {
			return await getBackend("/auth/me/a2f");
		}
		catch {
			return null;
		}
	}
}

export async function router(): Promise<void> {
	const currentPath = window.location.pathname;
	
	// Gérer le logout
	if (currentPath === "/logout") {
		await logout();
		await navigateTo("/login");
		return;
	}
	
	const nav = document.querySelector("nav");
	if (nav) {
		if (currentPath === "/login" || currentPath === "/register") {
			nav.style.display = "none";
		} else {
			nav.style.display = "flex";
		}
	}
	const renderPages = getRoute(currentPath);
	const app = document.getElementById("app");
	if (!app) {
		console.error("Routeur: #app introuvable dans le DOM");
		return;
	}
	if (protectedRoutes.includes(currentPath)) {
		const user = await getMe(currentPath === "/2fa-setup");
		if (!user){
			await navigateTo("/login");
			return ;
		}
	}
	if (currentPage && currentPage.onBeforeLeave) {
		await currentPage.onBeforeLeave();
	}
	if (currentPage && currentPage.onUnmount) {
		currentPage.onUnmount();
	}
	app.innerHTML = renderPages!.render();
	if (renderPages!.onMount) {
        renderPages!.onMount();
    }
	currentPage = renderPages!;
}

export async function navigateTo(href: string): Promise<void> {
	console.log("ROUTER →", window.location.pathname);
	if (window.location.pathname === href){
		await router();
		return ;
	}
	history.pushState({}, "", href);
	await router();
}
