import { test, describe, before, after, mock } from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import { app } from './server.ts';

describe('/api/research endpoint', () => {
  let originalFetch: typeof global.fetch;

  before(() => {
    originalFetch = global.fetch;
  });

  after(() => {
    global.fetch = originalFetch;
    mock.restoreAll();
  });

  test('should return 200 and research text on successful query without filters', async () => {
    let capturedUrl: string | URL | Request = '';
    let capturedBody: any = null;

    global.fetch = async (url, options: any) => {
      capturedUrl = url;
      if (options?.body) {
         capturedBody = JSON.parse(options.body.toString());
      }
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: "Mocked research findings for query without filters." }] } }]
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    const response = await supertest(app)
      .post('/api/research')
      .send({ query: 'test query' })
      .expect(200);

    assert.strictEqual(response.body.text, 'Mocked research findings for query without filters.');
    assert.ok(capturedUrl.toString().includes('gemini-3-flash-preview:generateContent'), 'Should call the correct model');
    assert.ok(capturedBody.contents[0].parts[0].text.includes('test query'), 'Should include query in prompt');
    assert.ok(!capturedBody.contents[0].parts[0].text.includes('CRITICAL SEARCH CONSTRAINTS YOU MUST ENFORCE'), 'Should not include constraints if no filters');
  });

  test('should return 200 and include constraints in prompt when filters are provided', async () => {
    let capturedBody: any = null;

    global.fetch = async (url, options: any) => {
      if (options?.body) {
         capturedBody = JSON.parse(options.body.toString());
      }
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: "Mocked research findings with filters." }] } }]
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    const response = await supertest(app)
      .post('/api/research')
      .send({
        query: 'test query',
        filters: { timeFrame: '24h', sourceType: 'news', relevance: 'high' }
      })
      .expect(200);

    assert.strictEqual(response.body.text, 'Mocked research findings with filters.');
    const prompt = capturedBody.contents[0].parts[0].text;
    assert.ok(prompt.includes('CRITICAL SEARCH CONSTRAINTS YOU MUST ENFORCE'), 'Should include constraints');
    assert.ok(prompt.includes('24 hours'), 'Should include time frame constraint');
    assert.ok(prompt.includes('News Media and Journalism outlets'), 'Should include source type constraint');
    assert.ok(prompt.includes('RELEVANCE SCORE'), 'Should include relevance constraint');
  });

  test('should return 500 when the API call fails', async () => {
    global.fetch = async () => {
      throw new Error('API request failed');
    };

    const response = await supertest(app)
      .post('/api/research')
      .send({ query: 'test query' })
      .expect(500);

    assert.strictEqual(response.body.error, 'API request failed');
  });
});
