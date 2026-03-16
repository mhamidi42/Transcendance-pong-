import type { GameMode } from "../store/gameMode.js";

export interface matchInfo {
	mode: GameMode;
	matchId: number;
	id_player1: number | null;
	id_player2: number | null;
	name_player1: string | null;
	name_player2: string | null;
	winner: string | null;
	loser: string | null;
	winner_id?: number | null;
	score1: number;
	score2: number;
	max_score: number;
	isAI?: boolean;
};
