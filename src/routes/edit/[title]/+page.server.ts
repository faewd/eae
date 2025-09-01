import { getArticle } from "$lib/api/storage";
import { parse } from "$lib/article/parse";
import * as db from "$lib/api/db";
import type { PageServerLoad } from "./$types";
import { error, redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ params, parent }) => {
  const { user } = await parent();

  if (user === null) return error(401, "You must be logged in to edit articles.");
  if (!user.isAdmin) return error(403, "You do not have permission to edit articles.");

  const readResult = await getArticle(params.title);

  if (readResult.ok) {
    return { article: await parse(readResult.content, db) };
  }

  return redirect(302, `/create/${params.title}`);
};
