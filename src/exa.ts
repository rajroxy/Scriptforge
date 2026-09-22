import { Exa } from "exa-js";

/**
 * Exa integration for Scriptforge.
 *
 * Requires EXA_API_KEY (get one at https://dashboard.exa.ai → API Keys).
 *
 * Exposes:
 *  - searchWeb()          → structured results with highlights
 *  - searchAsContext()    → LLM-ready context string for RAG grounding
 *  - webSearchToolSpec    → OpenAI-compatible tool definition
 *  - runWebSearchTool()   → executor for the tool definition
 */

let cachedClient: Exa | null = null;

/** Returns a shared Exa client, creating it on first use. */
export function getExaClient(): Exa {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    throw new Error(
      "EXA_API_KEY is not set. Add it in the Keys tab (or export it in your shell) " +
        "before using the Exa integration.",
    );
  }

  cachedClient = new Exa(apiKey);
  return cachedClient;
}

/** Search categories accepted by the Exa API. */
export type ExaSearchCategory =
  | "company"
  | "research paper"
  | "news"
  | "pdf"
  | "github"
  | "tweet"
  | "personal site"
  | "linkedin profile"
  | "financial report";

export interface WebSearchOptions {
  /** Max results to return (default 5, max 10 for this wrapper). */
  numResults?: number;
  /** Restrict results to domains like ["arxiv.org", "github.com"]. */
  includeDomains?: string[];
  /** Exclude results from these domains. */
  excludeDomains?: string[];
  /** Only include content published on/after this date (ISO 8601). */
  startPublishedDate?: string;
  /** Search category, e.g. "github", "news", "pdf", "tweet". */
  category?: ExaSearchCategory;
  /** Max characters of highlights per result (default 300). */
  maxCharacters?: number;
}

export interface WebSearchResult {
  title: string;
  url: string;
  publishedDate?: string;
  author?: string;
  score?: number;
  /** Key excerpts from the page content. */
  highlights: string[];
}

/** Perform a semantic web search with highlights. */
export async function searchWeb(
  query: string,
  options: WebSearchOptions = {},
): Promise<WebSearchResult[]> {
  const exa = getExaClient();

  const response = await exa.searchAndContents(query, {
    numResults: Math.min(options.numResults ?? 5, 10),
    includeDomains: options.includeDomains,
    excludeDomains: options.excludeDomains,
    startPublishedDate: options.startPublishedDate,
    category: options.category,
    highlights: {
      maxCharacters: options.maxCharacters ?? 300,
      query,
    },
  });

  return response.results.map((result) => ({
    title: result.title ?? result.url,
    url: result.url,
    publishedDate: result.publishedDate,
    author: result.author,
    score: result.score,
    highlights: result.highlights ?? [],
  }));
}

/** Perform a search and flatten the results into a single LLM-ready context string. */
export async function searchAsContext(
  query: string,
  options: WebSearchOptions = {},
): Promise<string> {
  const results = await searchWeb(query, options);
  if (results.length === 0) return "No relevant web results found.";

  return results
    .map(
      (result, index) =>
        `[${index + 1}] ${result.title} (${result.url})\n` +
        result.highlights.map((h) => `    ${h}`).join("\n"),
    )
    .join("\n\n");
}

/**
 * OpenAI-compatible function-calling tool definition so any LLM agent
 * can request fresh web data. Execute requests with runWebSearchTool().
 */
export const webSearchToolSpec = {
  type: "function" as const,
  function: {
    name: "web_search",
    description:
      "Search the live web with Exa for up-to-date, semantically relevant information. " +
      "Returns titles, URLs and key excerpts. Use for anything the model may not know " +
      "(recent events, current docs, live prices, etc.).",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query. Write it like a well-formed question or topic.",
        },
        numResults: {
          type: "integer",
          description: "Number of results to return (1-10).",
          default: 5,
        },
        category: {
          type: "string",
          description:
            "Optional category filter, e.g. 'news', 'github', 'pdf', 'tweet', 'company'.",
        },
      },
      required: ["query"],
    },
  },
};

/** Execute a web_search tool call emitted by an LLM (arguments are JSON string or object). */
export async function runWebSearchTool(
  args: string | Record<string, unknown>,
): Promise<string> {
  const parsed = typeof args === "string" ? (JSON.parse(args) as Record<string, unknown>) : args;
  const query = typeof parsed.query === "string" ? parsed.query : "";
  if (!query) throw new Error("web_search requires a 'query' argument.");

  return searchAsContext(query, {
    numResults: typeof parsed.numResults === "number" ? parsed.numResults : undefined,
    category:
      typeof parsed.category === "string" ? (parsed.category as ExaSearchCategory) : undefined,
  });
}
