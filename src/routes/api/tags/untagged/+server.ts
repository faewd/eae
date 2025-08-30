import { listUntaggedArticles } from "$lib/api/neo4j";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async () => {
  const articles = await listUntaggedArticles();
  return Response.json({ articles });
};
