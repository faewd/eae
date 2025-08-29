import { fetchByTag, listSimilarTags } from "$lib/api/neo4j";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const articles = await fetchByTag(params.label);
  const related = await listSimilarTags(params.label);
  return {
    tag: params.label,
    articles,
    related,
  };
};
