import { db } from "../db/sqlite";

export function checkDatabase(): boolean{
	if (db.prepare('SELECT 1').get())
		return true;
	return false;
}
