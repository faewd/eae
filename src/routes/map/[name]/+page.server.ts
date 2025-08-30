import { getPinsForMap } from "$lib/api/neo4j";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const pins = await getPinsForMap(params.name);
  return {
    pins,
  };
};
