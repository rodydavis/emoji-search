// @ts-ignore cannot fetch local build public/sqlite3.mjs
import { default as init } from "https://cdn.jsdelivr.net/npm/sqlite-vec-wasm-demo@latest/sqlite3.mjs";
import type { Sqlite3Static } from "@sqlite.org/sqlite-wasm";
import type { EmojiResult } from "./emojis";

const sqlite3: Sqlite3Static = await init();

const schema = `
CREATE TABLE emojis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL
);
CREATE VIRTUAL TABLE emojis_embeddings USING vec0(
    emoji_id INTEGER NOT NULL,
    embedding float[768]
);
`;

const db = new sqlite3.oo1.DB(":memory:");
db.exec(schema);

const insertStmt = db.prepare("INSERT INTO emojis_embeddings(emoji_id, embedding) VALUES (?, ?)");
const insertEmojiStmt = db.prepare("INSERT INTO emojis(name, description) VALUES (?, ?)");
export function insertEmoji(emoji: EmojiResult, embedding: Float32Array) {
    let e = db.selectObject("SELECT * FROM emojis WHERE name = ?", [emoji.emoji]);
    if (!e) {
        insertEmojiStmt
            .bind(1, emoji.emoji)
            .bind(2, emoji.description)
            .stepReset();
        e = db.selectObject("SELECT * FROM emojis WHERE name = ?", [emoji.emoji])!;
    }
    insertStmt
        .bind(1, e.id)
        .bind(2, embedding.buffer)
        .stepReset();
}

export function queryEmojis(embedding: Float32Array, limit = 8) {
    const rows = db
        .selectArrays(
        `
        SELECT
            emoji_id,
            emojis.name,
            emojis.description,
            distance
        FROM emojis_embeddings
        LEFT JOIN emojis
            ON emojis.id = emojis_embeddings.emoji_id
        WHERE embedding MATCH ?
        AND k = ${limit}
        ORDER BY distance
        `, embedding.buffer
        );
    return rows.map(e => ({
        id: e[0],
        emoji: e[1],
        description: e[2],
        distance: e[3],
    }));
}