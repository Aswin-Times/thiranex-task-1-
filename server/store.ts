import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { DatabaseShape } from './types.js';

const emptyDatabase: DatabaseShape = { users: [], tasks: [] };

export class JsonStore {
  private data: DatabaseShape = structuredClone(emptyDatabase);
  private ready: Promise<void>;
  private writeQueue = Promise.resolve();

  constructor(private readonly filePath = resolve('server/data/db.json')) {
    this.ready = this.load();
  }

  private async load() {
    await mkdir(dirname(this.filePath), { recursive: true });
    try {
      const raw = await readFile(this.filePath, 'utf8');
      this.data = JSON.parse(raw) as DatabaseShape;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      await this.persist();
    }
  }

  private async persist() {
    const temporaryPath = `${this.filePath}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(this.data, null, 2), 'utf8');
    await rename(temporaryPath, this.filePath);
  }

  async read<T>(reader: (database: DatabaseShape) => T): Promise<T> {
    await this.ready;
    return reader(this.data);
  }

  async update<T>(mutator: (database: DatabaseShape) => T): Promise<T> {
    await this.ready;
    let result!: T;
    this.writeQueue = this.writeQueue.then(async () => {
      result = mutator(this.data);
      await this.persist();
    });
    await this.writeQueue;
    return result;
  }
}

