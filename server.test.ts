import { test, describe, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

// Set test environment variables before importing app
process.env.NODE_ENV = 'production';
process.env.GEMINI_API_KEY = 'dummy';

import { app } from './server.ts';

describe('Server API Endpoints Error Paths', () => {
    afterEach(() => {
        mock.restoreAll();
    });

    test('quickAction endpoint handles internal errors and returns 500', async () => {
        // Mock global.fetch to force an error in GoogleGenAI SDK
        mock.method(global, 'fetch', async () => {
            return {
                ok: false,
                status: 500,
                json: async () => ({ error: { message: "Internal server error from Google API" } }),
                text: async () => "Internal server error from Google API"
            };
        });

        const response = await request(app)
            .post('/api/quickAction')
            .send({ content: 'test content', action: 'summarize' })
            .expect('Content-Type', /json/)
            .expect(500);

        assert.ok(response.body.error !== undefined, 'Response should contain an error object');
    });

    test('research endpoint handles internal errors and returns 500', async () => {
        mock.method(global, 'fetch', async () => {
            return {
                ok: false,
                status: 500,
                json: async () => ({ error: { message: "Internal server error from Google API" } }),
                text: async () => "Internal server error from Google API"
            };
        });

        const response = await request(app)
            .post('/api/research')
            .send({ query: 'test query' })
            .expect('Content-Type', /json/)
            .expect(500);

        assert.ok(response.body.error !== undefined, 'Response should contain an error object');
    });

    test('synthesize endpoint handles internal errors and returns 500', async () => {
        mock.method(global, 'fetch', async () => {
            return {
                ok: false,
                status: 500,
                json: async () => ({ error: { message: "Internal server error from Google API" } }),
                text: async () => "Internal server error from Google API"
            };
        });

        const response = await request(app)
            .post('/api/synthesize')
            .send({ content: 'test content', objective: 'test objective' })
            .expect('Content-Type', /json/)
            .expect(500);

        assert.ok(response.body.error !== undefined, 'Response should contain an error object');
    });
});
