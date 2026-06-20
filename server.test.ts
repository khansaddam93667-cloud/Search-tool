import { test, describe, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import sinon from 'sinon';
import { app, ai } from './server.ts';

describe('Server APIs', () => {
  let generateContentStub: sinon.SinonStub;

  beforeEach(() => {
    generateContentStub = sinon.stub();
    (ai as any).models = { generateContent: generateContentStub };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('POST /api/quickAction', () => {
    test('returns 200 with generated text on success', async () => {
      const mockResponseText = "Summarized content here.";
      generateContentStub.resolves({ text: mockResponseText });

      const response = await request(app)
        .post('/api/quickAction')
        .send({
          content: "Some long text...",
          action: "summarize"
        });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.text, mockResponseText);
      assert.ok(generateContentStub.calledOnce);

      const callArgs = generateContentStub.firstCall.args[0];
      assert.strictEqual(callArgs.model, "gemini-3.1-flash-lite-preview");
      assert.ok(callArgs.contents.includes("Action: summarize"));
      assert.ok(callArgs.contents.includes("Some long text..."));
    });

    test('returns 400 when content is missing or empty', async () => {
      const response = await request(app)
        .post('/api/quickAction')
        .send({
          content: "",
          action: "summarize"
        });

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.error, "Invalid content");
      assert.ok(generateContentStub.notCalled);
    });

    test('returns 400 when content exceeds max length', async () => {
      const response = await request(app)
        .post('/api/quickAction')
        .send({
          content: "a".repeat(100001),
          action: "summarize"
        });

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.error, "Content exceeds maximum length of 100000 characters");
      assert.ok(generateContentStub.notCalled);
    });

    test('returns 400 when action is missing or empty', async () => {
      const response = await request(app)
        .post('/api/quickAction')
        .send({
          content: "Some content",
          action: ""
        });

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.error, "Invalid action");
      assert.ok(generateContentStub.notCalled);
    });

    test('returns 400 when action exceeds max length', async () => {
      const response = await request(app)
        .post('/api/quickAction')
        .send({
          content: "Some content",
          action: "a".repeat(2001)
        });

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.error, "Action exceeds maximum length of 2000 characters");
      assert.ok(generateContentStub.notCalled);
    });

    test('returns 500 when AI model fails', async () => {
      generateContentStub.rejects(new Error("AI generation failed"));

      const response = await request(app)
        .post('/api/quickAction')
        .send({
          content: "Some text...",
          action: "translate"
        });

      assert.strictEqual(response.status, 500);
      assert.strictEqual(response.body.error, "AI generation failed");
    });
  });
});
