import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set. API requests will fail.');
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY || '' });

async function createServer() {
  const app = express();
  app.use(express.json());

  // API Endpoints
  app.post('/api/research', async (req, res) => {
    try {
      const { query, promptConstraints } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Conduct a deep research on the following topic and provide a detailed report with facts and recent developments: ${query}${promptConstraints || ''}`,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      res.json({ text: response.text || "No research findings found." });
    } catch (error: any) {
      console.error('Research API error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/synthesize', async (req, res) => {
    try {
      const { content, objective } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Objective: ${objective}\n\nAnalyze and synthesize the following content to meet the objective. Focus on deep insights, identifying patterns, and providing strategic recommendations.\n\nContent:\n${content}`,
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH
          }
        }
      });
      res.json({ text: response.text || "Synthesis failed." });
    } catch (error: any) {
      console.error('Synthesize API error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/quickAction', async (req, res) => {
    try {
      const { content, action } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: `Action: ${action}\n\nPerform the requested action on the following text quickly and concisely:\n\n${content}`,
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.MINIMAL
          }
        }
      });
      res.json({ text: response.text || "Action failed." });
    } catch (error: any) {
      console.error('QuickAction API error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

createServer();
