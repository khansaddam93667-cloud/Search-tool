import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface ResearchResult {
  summary: string;
  sources: { title: string; url: string }[];
}

export interface SearchFilters {
  timeFrame: 'any' | '24h' | '7d' | '1m' | '1y';
  sourceType: 'all' | 'news' | 'academic' | 'government';
  relevance: 'standard' | 'high';
}

export const geminiService = {
  /**
   * Conducts research using Google Search grounding.
   * Model: gemini-3-flash-preview
   */
  async research(query: string, filters?: SearchFilters): Promise<string> {
    let promptConstraints = "";
    if (filters && (filters.timeFrame !== 'any' || filters.sourceType !== 'all' || filters.relevance !== 'standard')) {
      promptConstraints = "\n\nCRITICAL SEARCH CONSTRAINTS YOU MUST ENFORCE:\n";
      
      if (filters.timeFrame !== 'any') {
        const timeMap = { '24h': '24 hours', '7d': '7 days', '1m': '1 month', '1y': '1 year' };
        promptConstraints += `- TIME FRAME: Focus ONLY on events, articles, and data from the past ${timeMap[filters.timeFrame]}. Explicitly filter out stale or old information.\n`;
      }
      
      if (filters.sourceType !== 'all') {
         const sourceMap = { 
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

    return response.text || "No research findings found.";
  },

  /**
   * Synthesizes complex information using high-thinking mode.
   * Model: gemini-3.1-pro-preview
   */
  async synthesize(content: string, objective: string): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Objective: ${objective}\n\nAnalyze and synthesize the following content to meet the objective. Focus on deep insights, identifying patterns, and providing strategic recommendations.\n\nContent:\n${content}`,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH
        }
      }
    });

    return response.text || "Synthesis failed.";
  },

  /**
   * Performs quick edits or summaries.
   * Model: gemini-3.1-flash-lite-preview
   */
  async quickAction(content: string, action: string): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: `Action: ${action}\n\nPerform the requested action on the following text quickly and concisely:\n\n${content}`,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL
        }
      }
    });

    return response.text || "Action failed.";
  }
};
