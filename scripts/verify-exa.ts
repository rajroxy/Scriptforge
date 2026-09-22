/**
 * Verification script for the Exa integration.
 *
 * Usage:
 *   bun run verify:exa            # full check (requires EXA_API_KEY)
 *   EXA_API_KEY=sk-... bun run verify:exa
 *
 * Confirms the key is set, the client initializes, and a real search
 * returns relevant results with highlights.
 */
import { getExaClient, searchWeb, searchAsContext } from "../src/exa.ts";

async function main() {
  console.log("── Exa integration check ─────────────────────────");

  // 1. Key present → client initializes
  let client;
  try {
    client = getExaClient();
  } catch (error) {
    console.error(`✗ ${(error as Error).message}`);
    process.exit(1);
  }
  console.log("✓ EXA_API_KEY found — Exa client initialized");

  // 2. Live search returns results with highlights and citations
  const query = "latest features of the TypeScript compiler";
  try {
    const results = await searchWeb(query, { numResults: 3 });
    if (results.length === 0) {
      console.error("✗ Search returned no results (unexpected for this query).");
      process.exit(1);
    }
    console.log(`✓ searchWeb("${query}") returned ${results.length} results:`);
    for (const r of results) {
      console.log(`    • ${r.title} → ${r.url}`);
    }

    const withHighlights = results.filter((r) => r.highlights.length > 0);
    if (withHighlights.length === 0) {
      console.error("✗ No results included highlights/citations.");
      process.exit(1);
    }
    console.log(`✓ ${withHighlights.length}/${results.length} results include highlights`);
  } catch (error) {
    console.error(`✗ Live search failed: ${(error as Error).message}`);
    process.exit(1);
  }

  // 3. RAG context builder works end-to-end
  try {
    const context = await searchAsContext("What is Retrieval-Augmented Generation?", {
      numResults: 2,
    });
    if (!context.includes("[1]")) {
      throw new Error("context string is not formatted as expected");
    }
    console.log(`✓ searchAsContext() produced ${context.length} chars of LLM-ready context`);
  } catch (error) {
    console.error(`✗ Context builder failed: ${(error as Error).message}`);
    process.exit(1);
  }

  console.log(`\nAll checks passed. Client type: ${client.constructor.name}`);
}

main().catch((error) => {
  console.error(`✗ Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
