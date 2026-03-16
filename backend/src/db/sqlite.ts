import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "db", "app.sqlite");
const SCHEMA_PATH = path.join(process.cwd(), "db", "schema.sql");

function initDatabase(): Database.Database {
	// Créer le dossier db s'il n'existe pas
	const dbDir = path.dirname(DB_PATH);
	if (!fs.existsSync(dbDir)) {
		fs.mkdirSync(dbDir, { recursive: true });
		console.log("📁 Created db directory");
	}

	const db = new Database(DB_PATH);
	db.pragma("foreign_keys = ON");

	// Vérifie si des tables existent déjà
	const tables = db
		.prepare(`SELECT name FROM sqlite_master WHERE type='table'`)
		.all();

	if (tables.length === 0) {
		console.log("🗄️ Initializing SQLite database...");
		const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
		db.exec(schema);
		console.log("✅ Database schema applied");
	} else {
		console.log("✅ Database already initialized");
	}

	return db;
}

export const db = initDatabase();



//import Database from "better-sqlite3";
//import fs from "fs";
//import path from "path";

//const DB_PATH = path.join(process.cwd(), "db", "app.sqlite");
//const SCHEMA_PATH = path.join(process.cwd(), "db", "schema.sql");

//function initDatabase(): Database.Database {
//    const db = new Database(DB_PATH);

//    db.pragma("foreign_keys = ON");

//    // Vérifie si des tables existent déjà
//    const tables = db
//        .prepare(`SELECT name FROM sqlite_master WHERE type='table'`)
//        .all();

//    if (tables.length === 0) {
//        console.log("🗄️ Initializing SQLite database...");
//        const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
//        db.exec(schema);
//        console.log("✅ Database schema applied");
//    }

//    return db;
//}

//export const db = initDatabase();
