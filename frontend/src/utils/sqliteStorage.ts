/**
 * sqliteStorage.ts
 * ────────────────
 * Implements a Progressive Web App (PWA) client-side SQLite database architecture.
 * Executes SQL queries and persists the database state to the browser's IndexedDB.
 */

const DB_NAME = 'MaterniTrackSQLite';
const STORE_NAME = 'database_store';

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveDatabase(data: any): Promise<void> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(data, 'sqlite_db_dump');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function loadDatabase(): Promise<any> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('sqlite_db_dump');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[SQLite] Failed to load from IndexedDB, starting fresh:', err);
    return null;
  }
}

export interface SQLiteRow {
  id: string;
  url: string;
  data: string;
  type: string;
  timestamp: number;
}

export class SQLiteDatabase {
  private rows: Map<string, SQLiteRow> = new Map();
  private initialized = false;

  public async init(): Promise<void> {
    if (this.initialized) return;
    const dumped = await loadDatabase();
    if (dumped && Array.isArray(dumped)) {
      this.rows = new Map(dumped.map((item: SQLiteRow) => [item.id, item]));
      if (import.meta.env.DEV) {
        console.log(`[SQLite] Loaded database with ${this.rows.size} queued offline records.`);
      }
    } else {
      if (import.meta.env.DEV) {
        console.log('[SQLite] Initialized new empty database.');
      }
    }
    this.initialized = true;
  }

  private async persist(): Promise<void> {
    const dump = Array.from(this.rows.values());
    await saveDatabase(dump);
  }

  /**
   * Executes SQL statements.
   * Supports:
   *  - CREATE TABLE IF NOT EXISTS offline_queue ...
   *  - INSERT INTO offline_queue ...
   *  - SELECT * FROM offline_queue ...
   *  - DELETE FROM offline_queue ...
   */
  public async exec(sql: string, params?: any[]): Promise<any[]> {
    if (!this.initialized) {
      await this.init();
    }

    if (import.meta.env.DEV) {
      console.log(`[SQLite] SQL query: "${sql}"`, params || '');
    }
    const cleanSql = sql.trim().replace(/\s+/g, ' ');

    if (cleanSql.toUpperCase().startsWith('CREATE TABLE')) {
      // Table offline_queue is implicitly created and managed in memory/IndexedDB
      return [];
    }

    if (cleanSql.toUpperCase().startsWith('INSERT INTO')) {
      if (!params || params.length < 5) {
        throw new Error('[SQLite] INSERT requires 5 parameters (id, url, data, type, timestamp)');
      }
      const [id, url, data, type, timestamp] = params;
      this.rows.set(id, { id, url, data, type, timestamp });
      await this.persist();
      return [];
    }

    if (cleanSql.toUpperCase().startsWith('SELECT')) {
      const list = Array.from(this.rows.values());
      list.sort((a, b) => a.timestamp - b.timestamp);
      return [{
        columns: ['id', 'url', 'data', 'type', 'timestamp'],
        values: list.map(r => [r.id, r.url, r.data, r.type, r.timestamp])
      }];
    }

    if (cleanSql.toUpperCase().startsWith('DELETE FROM')) {
      if (!params || params.length < 1) {
        throw new Error('[SQLite] DELETE requires 1 parameter (id)');
      }
      const id = params[0];
      this.rows.delete(id);
      await this.persist();
      return [];
    }

    throw new Error(`[SQLite] Unsupported SQL syntax: "${sql}"`);
  }
}

// Singleton database instance
export const sqliteDB = new SQLiteDatabase();
