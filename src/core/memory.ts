import type { MemoryEntry } from '../types.js';
import { logger } from '../utils/logger.js';
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Memory - Persistent knowledge store for the agent.
 *
 * Stores facts, conventions, and context across sessions so the agent
 * can make informed decisions based on accumulated knowledge. This is
 * a key component of the harness-engineering pattern, enabling
 * continuous learning and improvement.
 */
export class Memory {
  private entries: Map<string, MemoryEntry> = new Map();
  private filePath: string;
  private dirty = false;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  /** Load memory from disk */
  async load(): Promise<void> {
    if (await fs.pathExists(this.filePath)) {
      try {
        const raw = await fs.readFile(this.filePath, 'utf-8');
        const data = JSON.parse(raw) as MemoryEntry[];
        for (const entry of data) {
          this.entries.set(entry.id, {
            ...entry,
            createdAt: new Date(entry.createdAt),
          });
        }
        logger.info(`Memory loaded: ${this.entries.size} entries`);
      } catch (error) {
        logger.warn(`Failed to load memory, starting fresh: ${error}`);
        this.entries.clear();
      }
    }
  }

  /** Save memory to disk */
  async save(): Promise<void> {
    if (!this.dirty) return;

    await fs.ensureDir(path.dirname(this.filePath));

    const data = Array.from(this.entries.values());
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    this.dirty = false;
    logger.debug(`Memory saved: ${data.length} entries`);
  }

  /** Store a new fact in memory */
  store(subject: string, fact: string, source: string, tags: string[] = []): MemoryEntry {
    const entry: MemoryEntry = {
      id: uuidv4(),
      subject,
      fact,
      source,
      createdAt: new Date(),
      tags,
    };

    this.entries.set(entry.id, entry);
    this.dirty = true;
    logger.debug(`Memory stored: [${subject}] ${fact}`);
    return entry;
  }

  /** Retrieve memories by subject */
  getBySubject(subject: string): MemoryEntry[] {
    return Array.from(this.entries.values())
      .filter(e => e.subject.toLowerCase().includes(subject.toLowerCase()));
  }

  /** Retrieve memories by tag */
  getByTag(tag: string): MemoryEntry[] {
    return Array.from(this.entries.values())
      .filter(e => e.tags.includes(tag));
  }

  /** Search memories by keyword in fact text */
  search(keyword: string): MemoryEntry[] {
    const lower = keyword.toLowerCase();
    return Array.from(this.entries.values())
      .filter(e =>
        e.fact.toLowerCase().includes(lower) ||
        e.subject.toLowerCase().includes(lower),
      );
  }

  /** Get all memory entries */
  getAll(): MemoryEntry[] {
    return Array.from(this.entries.values());
  }

  /** Remove a memory entry */
  remove(id: string): boolean {
    const result = this.entries.delete(id);
    if (result) this.dirty = true;
    return result;
  }

  /** Get the total number of entries */
  get size(): number {
    return this.entries.size;
  }
}
