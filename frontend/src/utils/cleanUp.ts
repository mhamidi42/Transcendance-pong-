import { deleteBackend, postBackend } from "../communication/fetch.js";

export async function cleanUp(matchId: number, tournamentId?: number) : Promise<void> {
	try{
		if (tournamentId !== undefined)
			await postBackend(`/tournaments/${tournamentId}/aborted`);
		else
			await deleteBackend(`/matches/${matchId}`);
		await deleteBackend(`/users/default/`);
		console.log("Cleanup successful");
	} catch (error) {
		console.error("Cleanup failed:", error);
	}
}
