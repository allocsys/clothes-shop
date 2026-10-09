// Photo storage. Today: files on the server disk (UPLOAD_DIR, a Docker volume on the VPS).
// Everything that reads or writes photos goes through this file, so moving to ArvanCloud
// (S3-compatible) later means adding a second implementation of `Storage` here and choosing it
// with an env var (e.g. STORAGE_DRIVER=s3). Nothing else in the app has to change, because the
// database only holds keys like "products/abc.jpg" (see lib/media.ts for how keys become URLs).

import { promises as fs } from 'fs';
import path from 'path';

export type Storage = {
  /** Save a file under `key` (overwrites). */
  put(key: string, data: Buffer): Promise<void>;
  /** Read a file, or null when it does not exist. */
  get(key: string): Promise<Buffer | null>;
  /** Delete a file (no error when it is already gone). */
  remove(key: string): Promise<void>;
};

export const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
};

export function contentTypeOf(key: string): string | null {
  const ext = key.split('.').pop()?.toLowerCase() ?? '';
  return CONTENT_TYPES[ext] ?? null;
}

// A key is a relative path of safe characters, never "..", never absolute.
const KEY_RE = /^[a-z0-9][a-z0-9._-]*(\/[a-z0-9][a-z0-9._-]*)*$/i;
export function isValidKey(key: string): boolean {
  return key.length <= 200 && KEY_RE.test(key) && !key.includes('..') && contentTypeOf(key) !== null;
}

function diskStorage(rootDir: string): Storage {
  const root = path.resolve(rootDir);
  const fileOf = (key: string) => {
    if (!isValidKey(key)) throw new Error('Invalid storage key: ' + key);
    const file = path.resolve(root, key);
    if (!file.startsWith(root + path.sep)) throw new Error('Invalid storage key: ' + key);
    return file;
  };
  return {
    async put(key, data) {
      const file = fileOf(key);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, data);
    },
    async get(key) {
      try {
        return await fs.readFile(fileOf(key));
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
        throw e;
      }
    },
    async remove(key) {
      try {
        await fs.unlink(fileOf(key));
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
      }
    },
  };
}

let instance: Storage | null = null;
export function getStorage(): Storage {
  if (!instance) instance = diskStorage(process.env.UPLOAD_DIR || './data/uploads');
  return instance;
}
