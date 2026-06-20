import { test, mock, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { geminiService } from './geminiService.ts';
import type { SearchFilters } from './geminiService.ts';

describe('geminiService.research', () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  test('should throw an error when fetch response is not ok', async () => {
    mock.method(global, 'fetch', async () => {
      return {
        ok: false,
        statusText: 'Internal Server Error'
      };
    });

    await assert.rejects(
      async () => {
        await geminiService.research('test query');
      },
      (err: Error) => {
        assert.strictEqual(err.message, 'Research failed: Internal Server Error');
        return true;
      }
    );
  });

  test('should return text data when fetch response is ok', async () => {
    const mockData = { text: 'Mock research findings.' };
    mock.method(global, 'fetch', async () => {
      return {
        ok: true,
        json: async () => mockData
      };
    });

    const result = await geminiService.research('test query');
    assert.strictEqual(result, 'Mock research findings.');
  });

  test('should return fallback text when response text is empty', async () => {
    const mockData = { text: '' };
    mock.method(global, 'fetch', async () => {
      return {
        ok: true,
        json: async () => mockData
      };
    });

    const result = await geminiService.research('test query');
    assert.strictEqual(result, 'No research findings found.');
  });

  test('should handle filters correctly', async () => {
    let capturedOptions: any;

    mock.method(global, 'fetch', async (_url: string, options: any) => {
      capturedOptions = options;
      return {
        ok: true,
        json: async () => ({ text: 'Filtered data.' })
      };
    });

    const filters: SearchFilters = { timeFrame: '7d', sourceType: 'news', relevance: 'high' };
    await geminiService.research('test query', filters);

    const body = JSON.parse(capturedOptions.body);
    assert.deepStrictEqual(body.filters, filters);
    assert.strictEqual(body.query, 'test query');
  });
});
