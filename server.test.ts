import { test, mock, describe, it, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app, ai } from './server.ts';

describe('API Endpoints', () => {
  let consoleErrorMock: any;

  beforeEach(() => {
    // Suppress console.error during tests to keep output clean
    consoleErrorMock = mock.method(console, 'error', () => {});
  });

  afterEach(() => {
    mock.restoreAll();
  });

  describe('POST /api/research', () => {
    it('should return 500 when GoogleGenAI throws an error', async () => {
      mock.method(ai.models, 'generateContent', async () => {
        throw new Error('Simulated API Error');
      });

      const response = await request(app)
        .post('/api/research')
        .send({ query: 'test query', filters: {} })
        .set('Accept', 'application/json');

      assert.strictEqual(response.status, 500);
      assert.deepStrictEqual(response.body, { error: 'Simulated API Error' });
    });

    it('should return 200 on success', async () => {
      mock.method(ai.models, 'generateContent', async () => {
        return { text: 'Test success' };
      });

      const response = await request(app)
        .post('/api/research')
        .send({ query: 'test query', filters: {} })
        .set('Accept', 'application/json');

      assert.strictEqual(response.status, 200);
      assert.deepStrictEqual(response.body, { text: 'Test success' });
    });
  });

  describe('POST /api/synthesize', () => {
    it('should return 500 when GoogleGenAI throws an error', async () => {
      mock.method(ai.models, 'generateContent', async () => {
        throw new Error('Simulated API Error');
      });

      const response = await request(app)
        .post('/api/synthesize')
        .send({ content: 'test content', objective: 'test objective' })
        .set('Accept', 'application/json');

      assert.strictEqual(response.status, 500);
      assert.deepStrictEqual(response.body, { error: 'Simulated API Error' });
    });
  });

  describe('POST /api/quickAction', () => {
    it('should return 500 when GoogleGenAI throws an error', async () => {
      mock.method(ai.models, 'generateContent', async () => {
        throw new Error('Simulated API Error');
      });

      const response = await request(app)
        .post('/api/quickAction')
        .send({ content: 'test content', action: 'test action' })
        .set('Accept', 'application/json');

      assert.strictEqual(response.status, 500);
      assert.deepStrictEqual(response.body, { error: 'Simulated API Error' });
    });
  });
});
