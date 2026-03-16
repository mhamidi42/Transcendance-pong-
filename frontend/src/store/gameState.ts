//import { Match } from "../game/match.js";
//import { Tournament } from "../game/tournament.js";

export type GameState = {
	mode : "match" | "tournament" | null,
	winner : string | null,
	tournamentRunning : boolean
}
