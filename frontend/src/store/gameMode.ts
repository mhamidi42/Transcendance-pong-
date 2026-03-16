//import { Match } from "../game/match.js";
//import { Tournament } from "../game/tournament.js";

export type GameMode = {
	mode : "match"
} | {
	mode : "tournament",
	tournamentId: number
}
