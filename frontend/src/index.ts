import { router, navigateTo } from "./router.js";
// import { updateNavMenu } from "./_pages/navbar.js";
import { loadCurrentUser } from "./store/userStore.js";

function handleClick (ev: MouseEvent): void {
	const target = ev.target as HTMLElement | null; // Récupère l'élément cliqué
	if (!target)
			return ;
	const anchor = target.closest("a[data-link]") as HTMLAnchorElement | null; // Cherche le lien le plus proche avec data-link
	if (!anchor)
			return ;
	if (ev.defaultPrevented) // Si le clic a déjà été annulé par un autre code, on ignore
			return ;
	if (ev.button !== 0) // Ignore les clics qui ne sont pas le bouton gauche
			return ;
	if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) // Ignore les clics combinés avec Ctrl, Shift, Alt ou Cmd
			return ;

	const href = anchor.getAttribute("href"); // Récupère l'URL du lien
	if (!href)
			return ;

	// Si le lien est externe ou doit s'ouvrir dans un nouvel onglet, ne rien faire
	if (href.startsWith("http://") || href.startsWith("https://") || anchor.target === "_blank")
      return;
	ev.preventDefault(); // Empêche le navigateur de recharger la page
	navigateTo(href);   // Navigation SPA vers l'URL sans rechargement
}


async function init(): Promise<void> {
	// On synchronise le frontend avec la session backend
	await loadCurrentUser();

	// On affiche la navbar en fonction de l’état
	// updateNavMenu();

	// On rend la page courante
	router();

	// SPA listeners
	window.addEventListener("click", handleClick);
	window.addEventListener("popstate", router);
}

document.addEventListener("DOMContentLoaded", () => {
	init();
});
