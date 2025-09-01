import { getArticle, writeArticle } from "$lib/api/storage";
import { parse } from "$lib/article/parse";
import * as db from "$lib/api/db";
import dedent from "dedent";
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ params, parent }) => {
  const { user } = await parent();

  if (user === null) return error(401, "You must be logged in to edit articles.");
  if (!user.isAdmin) return error(403, "You do not have permission to edit articles.");

  const readResult = await getArticle(params.title);

  if (readResult.ok) {
    return await parse(readResult.content, db);
  }

  const writeResult = await writeArticle(params.title, makeDefaultArticle(params.title));
  if (writeResult.ok) return await parse(writeResult.content, db);

  return error(500, writeResult.error);
};

function makeDefaultArticle(title: string) {
  return dedent(`\
  ---

  ---

  # ${title}

  > [!tip]
  > This article is an automatically generated stub. Go to the [editor](/edit/${encodeURIComponent(title)}) to add content.
  `);
}
