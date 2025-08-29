import { listTags } from "$lib/api/neo4j";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async (event) => {
  const query = event.url.searchParams;
  const page = parseInt(query.get("page") ?? "0", 10);
  const size = parseInt(query.get("size") ?? "25", 10);
  const tags = await listTags(page, size);
  return Response.json({ tags });
};
