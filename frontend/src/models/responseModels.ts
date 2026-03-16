
type UserResponse = {
    id: number;
	alias: string;
	email: string | null;
	avatar: string | null;
}

type MatchResponse = {
	id: number;
}

type MatchInfoResponse = {
	id: number;
	score1: number;
	score2: number;
	id_player1: number | null;
	id_player2: number | null;
	name_player1: string | null;
	name_player2: string | null;
	winner_alias: string | null;
	loser_alias: string | null;
}

type TournamentResponse = {
	id: number;
}

type SettingsResponse = {
    success: boolean;
    message?: string;
}

type UserSettings = {
    ballSpeed: number;
    paddleSpeed: number;
    maxScore: number;
}

type UserMatch = {
    match_id: number;
    tournament_id: number;
    created_at: string;
};

type TournamentPlayerResponse = {
	alias: string;
	points: number;
	nb_games: number;
}

type MatchDisplay = {
    matchId: number;
    playerScore: number;
    opponentScore: number;
    opponentName: string;
    result: 'win' | 'loss';
    playedAt: string;
    tournamentId: number;
}

export type { MatchDisplay, UserMatch, UserResponse, MatchResponse, SettingsResponse, UserSettings, MatchInfoResponse, TournamentResponse, TournamentPlayerResponse };