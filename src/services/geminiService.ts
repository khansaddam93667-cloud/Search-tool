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
    const response = await fetch('/api/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, filters }),
    });

    if (!response.ok) {
      throw new Error(`Research failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.text || "No research findings found.";
  },

  /**
   * Synthesizes complex information using high-thinking mode.
   */
  async synthesize(content: string, objective: string): Promise<string> {
    const response = await fetch('/api/synthesize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, objective }),
    });

    if (!response.ok) {
      throw new Error(`Synthesis failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.text || "Synthesis failed.";
  },

  /**
   * Performs quick edits or summaries.
   */
  async quickAction(content: string, action: string): Promise<string> {
    const response = await fetch('/api/quickAction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, action }),
    });

    if (!response.ok) {
      throw new Error(`Action failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.text || "Action failed.";
  }
};
