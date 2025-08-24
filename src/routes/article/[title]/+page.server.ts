import { getArticle } from "$lib/api/storage";
import { parse } from "$lib/article/parse";
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ params }) => {
  const readResult = await getArticle(params.title);

  if (readResult.ok) {
    return parse(readResult.content);
  }

  return error(500, readResult.error);
};
