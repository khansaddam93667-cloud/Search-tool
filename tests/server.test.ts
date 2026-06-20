import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app, ai } from '../server.ts';
import { ThinkingLevel } from '@google/genai';

test('Integration Tests - /api/synthesize', async (t) => {
  // Save original generateContent method
  const originalGenerateContent = ai.models.generateContent;

  t.afterEach(() => {
    // Restore after each test
    ai.models.generateContent = originalGenerateContent;
  });

  await t.test('should successfully synthesize content and return 200', async () => {
    // Mock the generateContent function
    ai.models.generateContent = async (args: any) => {
      // Verify correct arguments are passed
      assert.strictEqual(args.model, 'gemini-3.1-pro-preview');
      assert.ok(args.contents.includes('Objective: Summarize this'));
      assert.ok(args.contents.includes('Test content here'));
      assert.strictEqual(args.config?.thinkingConfig?.thinkingLevel, ThinkingLevel.HIGH);

      return { text: 'Mocked synthesized text' } as any;
    };

    const response = await request(app)
      .post('/api/synthesize')
      .send({
        content: 'Test content here',
        objective: 'Summarize this'
      });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.text, 'Mocked synthesized text');
  });

  await t.test('should handle missing content in response', async () => {
    // Mock the generateContent function to return empty text
    ai.models.generateContent = async (args: any) => {
      return { text: '' } as any;
    };

    const response = await request(app)
      .post('/api/synthesize')
      .send({
        content: 'Test content here',
        objective: 'Summarize this'
      });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.text, 'Synthesis failed.');
  });

  await t.test('should handle API errors and return 500', async () => {
    // Mock the generateContent function to throw an error
    ai.models.generateContent = async (args: any) => {
      throw new Error('API Rate Limit Exceeded');
    };

    const response = await request(app)
      .post('/api/synthesize')
      .send({
        content: 'Test content here',
        objective: 'Summarize this'
      });

    assert.strictEqual(response.status, 500);
    assert.strictEqual(response.body.error, 'API Rate Limit Exceeded');
  });
});
