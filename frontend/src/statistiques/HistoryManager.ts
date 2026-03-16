// src/statistiques/HistoryManager.ts

import { getBackend } from '../communication/fetch.js';
import type { MatchDisplay, UserMatch, MatchInfoResponse } from '../models/responseModels.js';
import { escapeHtml } from '../utils/escapeHtml.js';

export class HistoryManager {
    private historyList: HTMLElement | null;
    private currentUserId: number | null = null;

    constructor(userId: number | null, userMatches: UserMatch[]) {
        this.historyList = document.getElementById('history-list');
        this.currentUserId = userId;
        this.loadHistory(userMatches);
    }

    private async loadHistory(userMatches: UserMatch[]) {
        try {
            if (userMatches && userMatches.length > 0) {
                // Récupérer les détails de chaque match
                const matchesWithDetails = await this.fetchMatchesDetails(userMatches);
                this.displayHistory(matchesWithDetails);
            } else {
                this.displayHistory([]);
            }
        } catch (error) {
            console.error('Failed to load history:', error);
            this.displayHistory([]);
        }
    }

    private async fetchMatchesDetails(userMatches: UserMatch[]): Promise<MatchDisplay[]> {
        const matchDisplays: MatchDisplay[] = [];
        
        for (const userMatch of userMatches) {
            try {
                const matchInfo = await getBackend<MatchInfoResponse>(`/matches/${userMatch.match_id}`);
                
                if (matchInfo) {
                    const userId = this.currentUserId;
                    const isPlayer1 = matchInfo.id_player1 === userId;
                    const playerScore = isPlayer1 ? matchInfo.score1 : matchInfo.score2;
                    const opponentScore = isPlayer1 ? matchInfo.score2 : matchInfo.score1;
                    
                    const result: 'win' | 'loss' = playerScore > opponentScore ? 'win' : 'loss';

                    // Déterminer le nom de l'adversaire
                    let opponentName = isPlayer1 ? matchInfo.name_player2 : matchInfo.name_player1;
                    if (!opponentName) {
                         const iAmWinner = (result === 'win');
                         if (iAmWinner) {
                            opponentName = matchInfo.loser_alias;
                         } else {
                            opponentName = matchInfo.winner_alias;
                         }
                    }
                    if (!opponentName) {
                        opponentName = "Unknown Player";
                    }
                    if (opponentName === "Invité_IA") {
                        opponentName = "Ordinateur";
                    }

                    matchDisplays.push({
                        matchId: userMatch.match_id,
                        playerScore,
                        opponentScore,
                        opponentName,
                        result,
                        playedAt: userMatch.created_at,
                        tournamentId: userMatch.tournament_id
                    });
                }
            } catch (error) {
                console.error(`Failed to fetch match ${userMatch.match_id}:`, error);
            }
        }
        
        return matchDisplays;
    }

    private displayHistory(matches: MatchDisplay[]) {
        if (!this.historyList) return;

        if (matches.length === 0) {
            this.historyList.innerHTML = `
                <div class="text-white/60 text-center py-12">
                    <div class="text-6xl mb-4">🎮</div>
                    <p class="text-xl">No matches played yet</p>
                    <p class="text-sm mt-2">Start playing to see your history!</p>
                </div>
            `;
            return;
        }

        this.historyList.innerHTML = matches.map((match, index) => {
            const isWin = match.result === 'win';
            const resultIcon = isWin ? '✓' : '✗';
            const resultText = isWin ? 'Victoire' : 'Défaite';
            
            // Déterminer si c'est un match de tournoi
            const matchType = match.tournamentId > 0 ? 'Tournoi' : 'Match Rapide';
            const matchIcon = match.tournamentId > 0 ? '🏆' : '⚡';

            // Formater la date
            const date = new Date(match.playedAt);
            const dateStr = date.toLocaleDateString('fr-FR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric'
            });
            const timeStr = date.toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            return `
                <div class="match-card bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/20 transition group">
                    <!-- Header -->
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isWin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}">
                                ${resultIcon}
                            </div>
                            <div>
                                <div class="text-white font-medium tracking-wide ${isWin ? 'text-emerald-400' : 'text-red-400'}">${resultText}</div>
                                <div class="text-slate-400 text-xs mt-0.5 font-light">${matchIcon} ${matchType}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-slate-300 text-sm font-light tracking-wide">${dateStr}</div>
                            <div class="text-slate-500 text-xs font-light">${timeStr}</div>
                        </div>
                    </div>

                    <div class="mb-3 text-center">
                         <div class="text-slate-500 text-[10px] uppercase tracking-wider mb-1">VS</div>
                        <div class="text-white font-medium">${escapeHtml(match.opponentName)}</div>
                    </div>

                    <!-- Stats -->
                    <div class="grid grid-cols-2 gap-1">
                        <div class="bg-black/20 rounded-lg p-2 text-center">
                            <div class="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Score</div>
                            <div class="text-white font-medium text-lg">
                                ${match.playerScore} - ${match.opponentScore}
                            </div>
                        </div>
                        <div class="bg-black/20 rounded-lg p-2 text-center">
                            <div class="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Match #</div>
                            <div class="text-white font-medium text-lg text-purple-300">${match.matchId}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    public cleanup() {
        // Cleanup if needed
    }
}


// Si tournoi 