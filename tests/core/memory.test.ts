import { describe, it, expect, beforeEach } from 'vitest';
import { Memory } from '../../src/core/memory.js';
import path from 'path';
import fs from 'fs-extra';

const TEST_MEMORY_PATH = path.join('/tmp', 'test-memory.json');

describe('Memory', () => {
  let memory: Memory;

  beforeEach(async () => {
    await fs.remove(TEST_MEMORY_PATH);
    memory = new Memory(TEST_MEMORY_PATH);
  });

  it('should store and retrieve a memory entry', () => {
    const entry = memory.store('test', 'This is a test fact', 'unit-test', ['tag1']);

    expect(entry.id).toBeDefined();
    expect(entry.subject).toBe('test');
    expect(entry.fact).toBe('This is a test fact');
    expect(entry.source).toBe('unit-test');
    expect(entry.tags).toEqual(['tag1']);
    expect(memory.size).toBe(1);
  });

  it('should search memories by subject', () => {
    memory.store('authentication', 'Use JWT tokens', 'config');
    memory.store('database', 'Use Prisma ORM', 'config');
    memory.store('auth-middleware', 'Apply auth to all routes', 'config');

    const results = memory.getBySubject('auth');
    expect(results.length).toBe(2);
  });

  it('should search memories by keyword', () => {
    memory.store('testing', 'Use vitest for unit testing', 'config');
    memory.store('linting', 'Use eslint with typescript plugin', 'config');

    const results = memory.search('vitest');
    expect(results.length).toBe(1);
    expect(results[0].subject).toBe('testing');
  });

  it('should search memories by tag', () => {
    memory.store('config', 'Fact 1', 'src', ['important']);
    memory.store('config', 'Fact 2', 'src', ['minor']);
    memory.store('config', 'Fact 3', 'src', ['important']);

    const results = memory.getByTag('important');
    expect(results.length).toBe(2);
  });

  it('should remove a memory entry', () => {
    const entry = memory.store('test', 'Remove me', 'test');
    expect(memory.size).toBe(1);

    const removed = memory.remove(entry.id);
    expect(removed).toBe(true);
    expect(memory.size).toBe(0);
  });

  it('should save and load from disk', async () => {
    memory.store('persist', 'This should persist', 'test');
    memory.store('persist', 'This too', 'test');
    await memory.save();

    const loaded = new Memory(TEST_MEMORY_PATH);
    await loaded.load();

    expect(loaded.size).toBe(2);
    expect(loaded.search('persist').length).toBe(2);
  });

  it('should handle loading from non-existent file', async () => {
    await memory.load();
    expect(memory.size).toBe(0);
  });

  it('should return all entries', () => {
    memory.store('a', 'fact a', 'test');
    memory.store('b', 'fact b', 'test');

    const all = memory.getAll();
    expect(all.length).toBe(2);
  });
});
