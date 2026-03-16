    -- Activer les clés étrangères (IMPORTANT avec SQLite)
PRAGMA foreign_keys = ON;

-- ============================================================
-- Table: users
-- Rôle : identité persistante d’un joueur
-- ============================================================
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alias TEXT NOT NULL UNIQUE,

	email TEXT UNIQUE,
    password_hash TEXT,

	oauth_id TEXT DEFAULT NULL,

	avatar TEXT DEFAULT NULL,
	is_guest BOOLEAN NOT NULL DEFAULT 0,

	twoFactorEnabled BOOLEAN DEFAULT false,
	twoFactorSecret TEXT DEFAULT NULL,
	twoFactorConfirmed BOOLEAN DEFAULT NULL,
	is_online INTEGER NOT NULL DEFAULT 0,
	last_seen DATETIME DEFAULT NULL,

	created_at DATETIME DEFAULT CURRENT_TIMESTAMP

);
-- 200 OK → succès
-- 400 Bad Request → champ invalide
-- 401 Unauthorized → pas connecté
-- 409 Conflict → alias déjà pris

-- ============================================================
-- Table: tournaments
-- ============================================================

CREATE TABLE tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME NOT NULL,
	aborted BOOLEAN DEFAULT 0
);


-- ============================================================
-- Table: matches
-- ============================================================
CREATE TABLE matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NULL,
    created_at DATETIME NOT NULL,
    max_score INTEGER NOT NULL DEFAULT 3,

    score_player1 INTEGER NOT NULL DEFAULT 0,
    score_player2 INTEGER NOT NULL DEFAULT 0,

    id_player1 INTEGER NULL,
    id_player2 INTEGER NULL,

	winner_id INTEGER NULL,
	winner_alias TEXT NULL,
	loser_alias TEXT NULL,

    status TEXT NOT NULL DEFAULT 'pending',

    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL,
	FOREIGN KEY (id_player1) REFERENCES users(id) ON DELETE SET NULL,
	FOREIGN KEY (id_player2) REFERENCES users(id) ON DELETE SET NULL,
	FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- Table: match_players
-- Rôle : liaison N↔N entre users et matches
-- ============================================================
CREATE TABLE match_players (
    match_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (match_id, user_id),
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- Table: pong_settings
-- Rôle : paramètres de jeu par utilisateur
-- ============================================================
CREATE TABLE pong_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL UNIQUE,

    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'none')),

    ballSpeed INTEGER NOT NULL,
    paddleSpeed INTEGER NOT NULL,

    backgroundColor TEXT NOT NULL,
    ballColor TEXT NOT NULL,
    paddleColor TEXT NOT NULL,

    player1Up TEXT NOT NULL,
    player1Down TEXT NOT NULL,
    player2Up TEXT NOT NULL,
    player2Down TEXT NOT NULL,

    maxScore INTEGER NOT NULL,

    powerUp BOOLEAN NOT NULL DEFAULT 0,

    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- Table: tournament_players
-- Rôle : inscription des joueurs à un tournoi
-- ============================================================
CREATE TABLE tournament_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    user_id INTEGER NULL,
	alias TEXT NOT NULL,
	points INTEGER NOT NULL DEFAULT 0,
    UNIQUE (tournament_id, user_id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);


-- ============================================================
-- Table: Friendships table
-- Rôle : 
-- ============================================================
CREATE TABLE friends (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL,
	friend_id INTEGER NOT NULL,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	UNIQUE (user_id, friend_id), -- un ami ne peut pas être ajouté deux fois
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- si un utilisateur est supprimé, ses relations disparaissent automatiquement
	FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
)