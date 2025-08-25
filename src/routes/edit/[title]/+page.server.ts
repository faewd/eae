import { getArticle, writeArticle } from "$lib/api/storage";
import { parse } from "$lib/article/parse";
import dedent from "dedent";
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ params }) => {
  const readResult = await getArticle(params.title);

  if (readResult.ok) {
    return parse(readResult.content);
  }

  const writeResult = await writeArticle(params.title, makeDefaultArticle(params.title));
  if (writeResult.ok) return parse(writeResult.content);

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
