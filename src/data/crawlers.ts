/**
 * Known AI crawler and assistant user-agent tokens. Shared by robots.txt (explicit allow) and the Worker's
 * crawler log (detection). Reviewed 2026-08-21 against current operator documentation; revisit quarterly.
 */
export interface Crawler {
  token: string;
  operator: string;
  purpose: 'training' | 'search-index' | 'user-fetch' | 'search';
}

export const aiCrawlers: Crawler[] = [
  { token: 'GPTBot', operator: 'OpenAI', purpose: 'training' },
  { token: 'OAI-SearchBot', operator: 'OpenAI', purpose: 'search-index' },
  { token: 'ChatGPT-User', operator: 'OpenAI', purpose: 'user-fetch' },
  { token: 'ClaudeBot', operator: 'Anthropic', purpose: 'training' },
  { token: 'Claude-SearchBot', operator: 'Anthropic', purpose: 'search-index' },
  { token: 'Claude-User', operator: 'Anthropic', purpose: 'user-fetch' },
  { token: 'anthropic-ai', operator: 'Anthropic', purpose: 'training' },
  { token: 'PerplexityBot', operator: 'Perplexity', purpose: 'search-index' },
  { token: 'Perplexity-User', operator: 'Perplexity', purpose: 'user-fetch' },
  { token: 'Google-Extended', operator: 'Google', purpose: 'training' },
  { token: 'Googlebot', operator: 'Google', purpose: 'search' },
  { token: 'Bingbot', operator: 'Microsoft', purpose: 'search' },
  { token: 'Applebot', operator: 'Apple', purpose: 'search' },
  { token: 'Applebot-Extended', operator: 'Apple', purpose: 'training' },
  { token: 'CCBot', operator: 'Common Crawl', purpose: 'training' },
  { token: 'Amazonbot', operator: 'Amazon', purpose: 'search-index' },
  { token: 'meta-externalagent', operator: 'Meta', purpose: 'training' },
  { token: 'meta-externalfetcher', operator: 'Meta', purpose: 'user-fetch' },
  { token: 'Bytespider', operator: 'ByteDance', purpose: 'training' },
  { token: 'cohere-ai', operator: 'Cohere', purpose: 'training' },
  { token: 'Diffbot', operator: 'Diffbot', purpose: 'search-index' },
  { token: 'Timpibot', operator: 'Timpi', purpose: 'search-index' },
  { token: 'DuckAssistBot', operator: 'DuckDuckGo', purpose: 'search-index' },
  { token: 'YouBot', operator: 'You.com', purpose: 'search-index' },
  { token: 'MistralAI-User', operator: 'Mistral', purpose: 'user-fetch' },
];

export const crawlerTokens = aiCrawlers.map((c) => c.token);
