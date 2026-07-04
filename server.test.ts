import { test, mock } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app, ai } from './server.ts';

test('synthesize endpoint error handling', async () => {
    // Mock the generateContent function on the exported 'ai' instance to throw an error
    const mockGenerateContent = mock.method(ai.models, 'generateContent', async () => {
        throw new Error("Simulated GenAI Error");
    });

    const response = await request(app)
        .post('/api/synthesize')
        .send({
            content: "Test content",
            objective: "Test objective"
        });

    assert.strictEqual(response.status, 500);
    assert.deepStrictEqual(response.body, { error: "Simulated GenAI Error" });

    // Restore the mock
    mockGenerateContent.mock.restore();
});
