import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });
dotenv.config();

// Workaround for process.env.NODE_ENV not reliably being 'test' in all test runners
const isTestEnv = process.env.NODE_ENV === 'test';

const myFilename = typeof __filename !== 'undefined' ? __filename : (typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : '');
const myDirname = typeof __dirname !== 'undefined' ? __dirname : (myFilename ? path.dirname(myFilename) : '');

export const app = express();
app.use(express.json());

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

app.post('/api/research', async (req, res) => {
  try {
    const { query, filters } = req.body;
    let promptConstraints = "";
    if (filters && (filters.timeFrame !== 'any' || filters.sourceType !== 'all' || filters.relevance !== 'standard')) {
      promptConstraints = "\n\nCRITICAL SEARCH CONSTRAINTS YOU MUST ENFORCE:\n";

      if (filters.timeFrame !== 'any') {
        const timeMap: Record<string, string> = { '24h': '24 hours', '7d': '7 days', '1m': '1 month', '1y': '1 year' };
        promptConstraints += `- TIME FRAME: Focus ONLY on events, articles, and data from the past ${timeMap[filters.timeFrame]}. Explicitly filter out stale or old information.\n`;
      }

      if (filters.sourceType !== 'all') {
         const sourceMap: Record<string, string> = {
           'news': 'News Media and Journalism outlets',
           'academic': 'Scholarly Articles, Journals, and .edu domains',
           'government': 'Official Government reports and .gov domains'
         };
         promptConstraints += `- SOURCE TYPE: Restrict your primary sources specifically to ${sourceMap[filters.sourceType]}. Avoid general blogs or unverified wikis.\n`;
      }

      if (filters.relevance === 'high') {
         promptConstraints += `- RELEVANCE SCORE: Internally evaluate each potential piece of information on a relevance score from 1 to 10. STRICTLY discard anything scoring below 8/10. Include only highly authoritative, exact-match insights.\n`;
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Conduct a deep research on the following topic and provide a detailed report with facts and recent developments: ${query}${promptConstraints}`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    res.json({ text: response.text || "No research findings found." });
  } catch (error: any) {
    if (!isTestEnv) console.error(error);
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
    if (!isTestEnv) console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/quickAction', async (req, res) => {
  try {
    // Add validation based on memory context
    const { content, action } = req.body;

    // Add missing input validation as mentioned in memories:
    // Input validation in server.ts is implemented via a validateString helper...
    if (typeof content !== 'string' || !content.trim()) {
      res.status(400).json({ error: "Invalid content" });
      return;
    }

    if (content.length > 100000) {
      res.status(400).json({ error: "Content exceeds maximum length of 100000 characters" });
      return;
    }

    if (typeof action !== 'string' || !action.trim()) {
      res.status(400).json({ error: "Invalid action" });
      return;
    }

    if (action.length > 2000) {
      res.status(400).json({ error: "Action exceeds maximum length of 2000 characters" });
      return;
    }

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
    if (!isTestEnv) console.error(error);
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (isTestEnv) {
    return;
  }

  if (process.argv[1] && fileURLToPath(import.meta.url) !== process.argv[1]) {
    return; // Don't start server if it's imported as a module (e.g. in tests)
  }

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(myDirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(myDirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
