import { getArticle } from "$lib/api/storage";
import { parse } from "$lib/article/parse";
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import * as db from "$lib/api/db";

export const load: PageServerLoad = async ({ params }) => {
  const readResult = await getArticle(params.title);

  if (readResult.ok) {
    return await parse(readResult.content, db);
  }

  return error(readResult.code === "not-found" ? 404 : 500, readResult.error);
};
