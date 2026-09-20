import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { AnalysisResult } from 'shared';

const dbPath = path.join(process.cwd(), '.data', 'cache.db');
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS repo_cache (
    key TEXT PRIMARY KEY,
    data TEXT
  );
  CREATE TABLE IF NOT EXISTS file_cache (
    repo_key TEXT,
    path TEXT,
    explanation TEXT,
    PRIMARY KEY (repo_key, path)
  );
`);

export const cache = {
  saveRepo(key: string, data: AnalysisResult) {
    const stmt = db.prepare('INSERT OR REPLACE INTO repo_cache (key, data) VALUES (?, ?)');
    stmt.run(key, JSON.stringify(data));
  },
  getRepo(key: string): AnalysisResult | null {
    const row = db.prepare('SELECT data FROM repo_cache WHERE key = ?').get(key) as any;
    if (!row) return null;
    return JSON.parse(row.data);
  },
  saveFile(repoKey: string, path: string, explanation: string) {
    const stmt = db.prepare('INSERT OR REPLACE INTO file_cache (repo_key, path, explanation) VALUES (?, ?, ?)');
    stmt.run(repoKey, path, explanation);
  },
  getFile(repoKey: string, path: string): string | null {
    const row = db.prepare('SELECT explanation FROM file_cache WHERE repo_key = ? AND path = ?').get(repoKey, path) as any;
    if (!row) return null;
    return row.explanation;
  },
  clear() {
    db.exec('DELETE FROM repo_cache; DELETE FROM file_cache;');
  }
};
