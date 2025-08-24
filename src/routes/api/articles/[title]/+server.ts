import { mergeIntoGraph } from "$lib/api/neo4j";
import { patchAndRenameArticle, patchArticle, writeArticle, type DBResult } from "$lib/api/storage";
import { extractNames } from "$lib/article/diff";
import { parse } from "$lib/article/parse";
import type { RequestHandler } from "./$types";

export const PATCH: RequestHandler = async (event) => {
  const name = event.params.title;
  const patch = await event.request.text();
  const [oldName, newName] = extractNames(patch);
  const isRename = newName !== oldName;
  const result = isRename
    ? await patchAndRenameArticle(name, newName, patch)
    : await patchArticle(name, patch);

  return mergeAndRespond(result, isRename ? oldName : undefined);
};

export const PUT: RequestHandler = async (event) => {
  const name = event.params.title;
  const source = await event.request.text();
  const result = await writeArticle(name, source);
  return mergeAndRespond(result);
};

async function mergeAndRespond(result: DBResult, oldName?: string): Promise<Response> {
  if (result.ok) {
    try {
      const article = parse(result.content);
      const mergeResult = await mergeIntoGraph(article, oldName);
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
}
