import { getArticle } from "$lib/api/storage";
import { parse } from "$lib/article/parse";
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ params }) => {
  const res = await getArticle(params.articleId);

  if (!res.ok) {
    error(404, "No such article!");
  }

  return parse(res.content);
};
