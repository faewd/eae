import { getEvents } from "$lib/api/neo4j";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async (event) => {
  const query = event.url.searchParams;
  const offset = parseInt(query.get("offset") ?? "0", 10);
  const limit = parseInt(query.get("limit") ?? "25", 10);
  const events = await getEvents(limit, offset);
  return Response.json({ events });
};
