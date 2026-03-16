import { type Page } from "../models/pageType.js";
import { StatsPageManager } from '../statistiques/StatsPageManager.js';
import { getCurrentUser } from "../store/userStore.js";

let statsManager: StatsPageManager | null = null;

export const StatsPage: Page = {
    render(): string {
        return `
            <div class="flex justify-center pt-20 pb-12 min-h-screen">
                <div class="w-full max-w-4xl mx-4">
                    <div class="glass-panel p-8">
                        <div class="flex justify-between items-center mb-8">
                            <h2 class="title-elegant !mb-0">Statistics</h2>
                            <a href="/" data-link class="text-white/50 hover:text-white transition">← Back</a>
                        </div>
                        
                        <div class="bg-white/5 rounded-xl p-4 mb-8 text-center border border-white/5">
                            <div class="text-slate-400 text-xs uppercase tracking-wider mb-2">User ID</div>
                            <div id="stat-user-id" class="text-white text-3xl font-light tracking-widest">#1</div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div class="bg-white/5 rounded-xl p-6 text-center border border-white/5">
                                <div class="text-slate-400 text-xs uppercase tracking-wider mb-2">Total Matches</div>
                                <div id="stat-games-played" class="text-blue-400 text-4xl font-light">0</div>
                            </div>
                            <div class="bg-white/5 rounded-xl p-6 text-center border border-white/5">
                                <div class="text-slate-400 text-xs uppercase tracking-wider mb-2">Total Wins</div>
                                <div id="stat-wins" class="text-emerald-400 text-4xl font-light">0</div>
                            </div>
                            <div class="bg-white/5 rounded-xl p-6 text-center border border-white/5">
                                <div class="text-slate-400 text-xs uppercase tracking-wider mb-2">Streak</div>
                                <div id="stat-win-streak" class="text-amber-400 text-4xl font-light">0</div>
                            </div>
                        </div>

                        <!-- Match Outcomes Chart -->
                        <div class="bg-white/5 rounded-xl p-6 text-center border border-white/5 mb-8">
                            <div class="text-slate-400 text-xs uppercase tracking-wider mb-2">Match Outcomes</div>
                            <div class="flex justify-center h-[200px]">
                                <canvas id="winLossChart" class="max-h-full"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Match History Section -->
                    <div class="glass-panel p-8 mt-6">
                        <div class="flex justify-between items-center mb-6">
                            <h2 class="title-elegant !mb-0">Match History</h2>
                        </div>
                        
                        <div id="history-list" class="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            <div class="text-slate-400 text-center py-12">
                                <div class="text-4xl mb-4 opacity-50">🎮</div>
                                <p class="text-lg font-light">Loading history...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    onMount() {
        const currentUserId = getCurrentUser();
        console.log("StatsPage mounted for user ID:", currentUserId);
        statsManager = new StatsPageManager(currentUserId);
    },

    onUnmount() {
        if (statsManager) {
            statsManager.cleanup();
            statsManager = null;
        }
    }
};
