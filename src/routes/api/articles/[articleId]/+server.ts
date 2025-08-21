import { mergeArticle } from "$lib/api/neo4j";
import { patchAndRenameArticle, patchArticle } from "$lib/api/storage";
import { extractNames } from "$lib/article/diff";
import { parse } from "$lib/article/parse";
import type { RequestHandler } from "./$types";

export const PATCH: RequestHandler = async (event) => {
  const name = event.params.articleId;
  const patch = await event.request.text();
  const [oldName, newName] = extractNames(patch);
  const result =
    newName === oldName
      ? await patchArticle(name, patch)
      : await patchAndRenameArticle(name, newName, patch);

  if (result.ok) {
    try {
      const article = parse(result.content);
      const mergeResult = await mergeArticle(article);
      if (!mergeResult.ok) {
        console.error(mergeResult.error);
        return Response.json({ error: "Failed to update article graph." }, { status: 500 });
      }
    } catch (err) {
      console.error(err);
      return Response.json({ error: "Failed to parse updated article." }, { status: 500 });
    }
  }

  return Response.json(result, { status: result.ok ? 200 : 400 });
};
