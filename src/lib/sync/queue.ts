import { openDB, type IDBPDatabase } from "idb";

interface SyncEntry {
  id?: number;
  table: string;
  operation: "insert" | "update" | "delete" | "rpc";
  payload: Record<string, unknown>;
  createdAt: string;
}

const DB_NAME = "sweet-delights-sync";
const DB_VERSION = 1;
const STORE_NAME = "sync_queue";
const CACHE_STORE = "data_cache";

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE);
      }
    },
  });
}

export async function enqueue(entry: Omit<SyncEntry, "id">) {
  const db = await getDB();
  await db.add(STORE_NAME, entry);
}

export async function dequeue(): Promise<SyncEntry[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function removeEntry(id: number) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function pendingCount(): Promise<number> {
  const db = await getDB();
  return db.count(STORE_NAME);
}

// Data cache for offline reads
export async function setCache(key: string, data: unknown) {
  const db = await getDB();
  await db.put(CACHE_STORE, data, key);
}

export async function getCache<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  return db.get(CACHE_STORE, key) as Promise<T | undefined>;
}
