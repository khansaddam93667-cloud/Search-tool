import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import { geminiService } from './geminiService.ts';

describe('geminiService', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    mock.restoreAll();
  });

  describe('research', () => {
    it('should successfully perform research and return text', async () => {
      const mockResponse = { text: 'Successful research result' };
      const fetchMock = mock.fn(async (...args: any[]) => {
        return new Response(JSON.stringify(mockResponse), {
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'Content-Type': 'application/json' }),
        });
      });
      globalThis.fetch = fetchMock as any;

      const result = await geminiService.research('query', { timeFrame: 'any', sourceType: 'all', relevance: 'standard' });

      assert.strictEqual(result, 'Successful research result');
      assert.strictEqual(fetchMock.mock.calls.length, 1);
      const callArgs = fetchMock.mock.calls[0].arguments as any[];
      assert.strictEqual(callArgs[0], '/api/research');
      assert.strictEqual(callArgs[1]?.method, 'POST');
      assert.strictEqual(callArgs[1]?.headers?.['Content-Type'], 'application/json');
      assert.strictEqual(callArgs[1]?.body, JSON.stringify({ query: 'query', filters: { timeFrame: 'any', sourceType: 'all', relevance: 'standard' } }));
    });

    it('should successfully perform research without filters', async () => {
      const mockResponse = { text: 'Successful research result' };
      const fetchMock = mock.fn(async (...args: any[]) => {
        return new Response(JSON.stringify(mockResponse), {
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'Content-Type': 'application/json' }),
        });
      });
      globalThis.fetch = fetchMock as any;

      const result = await geminiService.research('query');

      assert.strictEqual(result, 'Successful research result');
      const callArgs = fetchMock.mock.calls[0].arguments as any[];
      assert.strictEqual(callArgs[1]?.body, JSON.stringify({ query: 'query' }));
    });

    it('should throw an error when the API request fails', async () => {
      const fetchMock = mock.fn(async (...args: any[]) => {
        return new Response('Not Found', {
          status: 404,
          statusText: 'Not Found',
        });
      });
      globalThis.fetch = fetchMock as any;

      await assert.rejects(
        async () => {
          await geminiService.research('query');
        },
        (error: Error) => {
          assert.strictEqual(error.message, 'Research failed: Not Found');
          return true;
        }
      );
    });

    it('should return fallback text when API returns empty text', async () => {
      const mockResponse = { text: '' };
      const fetchMock = mock.fn(async (...args: any[]) => {
        return new Response(JSON.stringify(mockResponse), {
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'Content-Type': 'application/json' }),
        });
      });
      globalThis.fetch = fetchMock as any;

      const result = await geminiService.research('query');

      assert.strictEqual(result, 'No research findings found.');
    });
  });

  describe('synthesize', () => {
    it('should successfully synthesize and return text', async () => {
      const mockResponse = { text: 'Successful synthesis result' };
      const fetchMock = mock.fn(async (...args: any[]) => {
        return new Response(JSON.stringify(mockResponse), {
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'Content-Type': 'application/json' }),
        });
      });
      globalThis.fetch = fetchMock as any;

      const result = await geminiService.synthesize('content', 'objective');

      assert.strictEqual(result, 'Successful synthesis result');
      assert.strictEqual(fetchMock.mock.calls.length, 1);
      const callArgs = fetchMock.mock.calls[0].arguments as any[];
      assert.strictEqual(callArgs[0], '/api/synthesize');
      assert.strictEqual(callArgs[1]?.method, 'POST');
      assert.strictEqual(callArgs[1]?.headers?.['Content-Type'], 'application/json');
      assert.strictEqual(callArgs[1]?.body, JSON.stringify({ content: 'content', objective: 'objective' }));
    });

    it('should throw an error when the API request fails', async () => {
      const fetchMock = mock.fn(async (...args: any[]) => {
        return new Response('Not Found', {
          status: 404,
          statusText: 'Not Found',
        });
      });
      globalThis.fetch = fetchMock as any;

      await assert.rejects(
        async () => {
          await geminiService.synthesize('content', 'objective');
        },
        (error: Error) => {
          assert.strictEqual(error.message, 'Synthesis failed: Not Found');
          return true;
        }
      );
    });

    it('should return fallback text when API returns empty text', async () => {
      const mockResponse = { text: '' };
      const fetchMock = mock.fn(async (...args: any[]) => {
        return new Response(JSON.stringify(mockResponse), {
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'Content-Type': 'application/json' }),
        });
      });
      globalThis.fetch = fetchMock as any;

      const result = await geminiService.synthesize('content', 'objective');

      assert.strictEqual(result, 'Synthesis failed.');
    });
  });

  describe('quickAction', () => {
    it('should successfully perform a quick action and return text', async () => {
      const mockResponse = { text: 'Successful action result' };
      const fetchMock = mock.fn(async (...args: any[]) => {
        return new Response(JSON.stringify(mockResponse), {
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'Content-Type': 'application/json' }),
        });
      });
      globalThis.fetch = fetchMock as any;

      const result = await geminiService.quickAction('content', 'action');

      assert.strictEqual(result, 'Successful action result');
      assert.strictEqual(fetchMock.mock.calls.length, 1);
      const callArgs = fetchMock.mock.calls[0].arguments as any[];
      assert.strictEqual(callArgs[0], '/api/quickAction');
      assert.strictEqual(callArgs[1]?.method, 'POST');
      assert.strictEqual(callArgs[1]?.headers?.['Content-Type'], 'application/json');
      assert.strictEqual(callArgs[1]?.body, JSON.stringify({ content: 'content', action: 'action' }));
    });

    it('should throw an error when the API request fails', async () => {
      const fetchMock = mock.fn(async (...args: any[]) => {
        return new Response('Not Found', {
          status: 404,
          statusText: 'Not Found',
        });
      });
      globalThis.fetch = fetchMock as any;

      await assert.rejects(
        async () => {
          await geminiService.quickAction('content', 'action');
        },
        (error: Error) => {
          assert.strictEqual(error.message, 'Action failed: Not Found');
          return true;
        }
      );
    });

    it('should return fallback text when API returns empty text', async () => {
      const mockResponse = { text: '' };
      const fetchMock = mock.fn(async (...args: any[]) => {
        return new Response(JSON.stringify(mockResponse), {
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'Content-Type': 'application/json' }),
        });
      });
      globalThis.fetch = fetchMock as any;

      const result = await geminiService.quickAction('content', 'action');

      assert.strictEqual(result, 'Action failed.');
    });
  });
});
