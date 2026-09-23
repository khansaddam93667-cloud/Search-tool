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

    const response = await fetch('/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, promptConstraints })
    });
    const data = await response.json();
    return data.text || "No research findings found.";
  },

  /**
   * Synthesizes complex information using high-thinking mode.
   */
  async synthesize(content: string, objective: string): Promise<string> {
    const response = await fetch('/api/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, objective })
    });
    const data = await response.json();
    return data.text || "Synthesis failed.";
  },

  /**
   * Performs quick edits or summaries.
   */
  async quickAction(content: string, action: string): Promise<string> {
    const response = await fetch('/api/quickAction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, action })
    });
    const data = await response.json();
    return data.text || "Action failed.";
  }
};
