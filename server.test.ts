import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from './server.ts';

test('server API tests', async (t) => {
  await t.test('POST /api/quickAction should handle errors and return 500', async () => {
    const originalFetch = global.fetch;
    let fetchCalled = false;

    global.fetch = async (...args) => {
      fetchCalled = true;
      throw new Error('Simulated Gemini API error for quickAction');
    };

    try {
      const response = await request(app)
        .post('/api/quickAction')
        .send({ content: 'Test content', action: 'summarize' })
        .expect(500);

      assert.strictEqual(response.body.error, 'Simulated Gemini API error for quickAction');
      assert.ok(fetchCalled);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
