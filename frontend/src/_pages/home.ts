import { type Page } from "../models/pageType.js";

export const HomePage: Page = {
    render(): string {
        return `
        <div class="page-container space-y-8">
            <div class="text-center space-y-4">
                <h1 class="title-display text-gray-900">Home</h1>
                <div class="w-16 h-1 bg-gray-900 mx-auto rounded-full"></div>
                <p class="text-lg text-gray-600 font-light">Bienvenue dans ft_transcendance</p>
                <p class="text-sm text-gray-400 uppercase tracking-widest pt-4">Please select a mode</p>
            </div>

            <ul class="w-full max-w-lg space-y-4">
                <li>
                    <a href="/tournament" data-link class="btn-menu block">
                        Lancer un tournoi
                    </a>
                </li>
                <li>
                    <a href="/match-setup" data-link class="btn-menu block">
                        Jouer un match
                    </a>
                </li>
                <li>
                    <a href="/stats" data-link class="btn-menu block">
                        Voir les statistiques
                    </a>
                </li>
            </ul>
        </div>
        `;
    },
}

