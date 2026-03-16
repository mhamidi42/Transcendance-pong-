// src/statistiques/StatsPageManager.ts

import { getBackend, postBackend } from '../communication/fetch.js';
import { HistoryManager } from './HistoryManager.js';
import { WinLossChart } from './WinLossChart.js';
import type { GameStats } from '../types/types.js';
import type { UserMatch, MatchInfoResponse, UserResponse } from '../models/responseModels.js';

export class StatsPageManager {
    private resetButton: HTMLElement | null;
    private historyManager: HistoryManager | null = null;
    private currentUserId: number | null = null;
    private currentAlias: string | null = null;
    private userMatches: UserMatch[] | null = null;

    constructor(user: UserResponse | null) {
        this.resetButton = document.getElementById('resetStatsBtn');
        this.currentUserId = user ? user.id : null;
        this.currentAlias = user ? user.alias : null;
        this.userMatches = null;
        
        this.init();
    }

    private init() {
        this.resetButton?.addEventListener('click', () => this.resetStats());
        this.loadStats();
    }

    private async loadStats() {
        if (this.currentUserId) {
            try {
                // Récupérer et stocker les UserMatch
                this.userMatches = await getBackend<UserMatch[]>(`/users/${this.currentUserId}/matches`);
                
                let stats: GameStats;

                if (this.userMatches && this.userMatches.length > 0) {
                    // Créer les stats à partir des matches
                    stats = await this.createStats();
                    this.displayStats(stats);
                    
                    // Initialiser HistoryManager avec les matches
                    this.historyManager = new HistoryManager(this.currentUserId, this.userMatches);
                } else {
                    stats = {
                        gamesPlayed: 0,
                        wins: 0,
                        losses: 0,
                        bestScore: 0,
                        totalPlayTime: 0,
                        currentWinStreak: 0,
                        bestWinStreak: 0
                    };
                    this.displayStats(stats);
                    // Initialiser HistoryManager avec tableau vide
                    this.historyManager = new HistoryManager(this.currentUserId, []);
                }

                // Initialiser le graphique
                const chart = new WinLossChart('winLossChart');
                chart.render(stats.wins, stats.losses);

            } catch (error) {
                console.error('Failed to load stats:', error);
            }
        }
    }

    private async createStats(): Promise<GameStats> {
        if (!this.userMatches) {
            return {
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                bestScore: 0,
                totalPlayTime: 0,
                currentWinStreak: 0,
                bestWinStreak: 0
            };
        }

        let wins = 0;
        let losses = 0;
        let bestScore = 0;
        let currentWinStreak = 0;
        let bestWinStreak = 0;
        let gamesPlayed = 0;

        for (const match of this.userMatches) {
            try {
                // Fetch match details to get scores
                const matchInfo = await getBackend<MatchInfoResponse>(`/matches/${match.match_id}`);
                
                if (!matchInfo) continue;
                
                gamesPlayed++;
                
                // Déterminer si le joueur est id1 ou id2
                const userId = Number(this.currentUserId);
                const isPlayer1 = matchInfo.id_player1 === userId;
                const myScore = isPlayer1 ? matchInfo.score1 : matchInfo.score2;
                const opponentScore = isPlayer1 ? matchInfo.score2 : matchInfo.score1;

                if (myScore > bestScore) {
                    bestScore = myScore;
                }

                if (myScore > opponentScore) {
                    wins++;
                    currentWinStreak++;
                    if (currentWinStreak > bestWinStreak) {
                        bestWinStreak = currentWinStreak;
                    }
                } else {
                    losses++;
                    currentWinStreak = 0;
                }
            } catch (error) {
                console.error(`Failed to fetch match info for match ${match.match_id}:`, error);
            }
        }

        return {
            gamesPlayed: gamesPlayed,
            wins: wins,
            losses: losses,
            bestScore: bestScore,
            totalPlayTime: 0, // Not available in backend data
            currentWinStreak: currentWinStreak,
            bestWinStreak: bestWinStreak
        };
    }

    private displayStats(stats: GameStats) {
        this.updateStatElement('user-id', `#${this.currentAlias}`);
        const winRate = stats.gamesPlayed > 0 
            ? ((stats.wins / stats.gamesPlayed) * 100).toFixed(1)
            : '0';
        this.updateStatElement('win-rate', `${winRate}%`);
        this.updateStatElement('games-played', stats.gamesPlayed.toString());
        this.updateStatElement('win-streak', stats.currentWinStreak?.toString() || '0');
        // Stats supplémentaires
        this.updateStatElement('wins', stats.wins.toString());
        this.updateStatElement('losses', stats.losses.toString());
        this.updateStatElement('best-score', stats.bestScore.toString());
    }

    private updateStatElement(id: string, value: string) {
        const element = document.getElementById(`stat-${id}`);
        if (element) {
            element.textContent = value;
        }
    }

    private async resetStats() {
        if (!confirm('⚠️ Reset ALL statistics? This cannot be undone!')) {
            return;
        }
        if (this.currentUserId) {
            try {
                const response = await postBackend<{ ok: boolean }>(`/api/stats/${this.currentUserId}/reset`, {});
                if (response.ok == true) {
                    console.log('✅ Statistics reset successfully!');
                    this.loadStats();
                } else {
                    console.log('❌ Failed to reset statistics');
                }
            } catch (error) {
                console.error('Failed to reset stats:', error);
                console.log('❌ Failed to reset statistics');
            }
        } else {
            console.log('❌ User not logged in');
        }
    }

    public cleanup() {
        // Remove event listeners if needed
        this.resetButton?.removeEventListener('click', () => this.resetStats());
        if (this.historyManager) {
            this.historyManager.cleanup();
        }
    }
}
