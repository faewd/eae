import { searchArticles } from "$lib/api/neo4j";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
  try {
    const query = url.searchParams.get("q");
    if (query === null || query === "") return { query, results: [] };
    return {
      query,
      results: await searchArticles(query ?? ""),
    };
  } catch (err) {
    console.error(err);
    return error(500, "Something went wrong searching the index.");
  }
};
