import { mergeIntoGraph, removeFromGraph } from "$lib/api/neo4j";
import { getUser } from "$lib/api/auth";
import { deleteArticle, patchAndRenameArticle, patchArticle } from "$lib/api/storage";
import { extractNames } from "$lib/article/diff";
import { parse } from "$lib/article/parse";
import type { RequestHandler } from "./$types";
import * as db from "$lib/api/db";
import { error } from "@sveltejs/kit";

export const PATCH: RequestHandler = async (event) => {
  const user = await getUser(event.cookies);
  if (user === null) return error(401, "You must be logged in to edit articles.");
  if (!user.isAdmin) return error(403, "You do not have permission to edit articles.");

  const name = event.params.title;
  const patch = await event.request.text();
  const [oldName, newName] = extractNames(patch);
  const isRename = newName !== oldName;
  const result = isRename
    ? await patchAndRenameArticle(name, newName, patch)
    : await patchArticle(name, patch);

  if (result.ok) {
    try {
      const article = await parse(result.content, db);
      const mergeResult = await mergeIntoGraph(article, oldName);
      if (!mergeResult.ok) {
        console.error(mergeResult);
        return Response.json({ error: "Failed to update article graph." }, { status: 500 });
      }
    } catch (err) {
      console.error(err);
      return Response.json({ error: "Failed to parse updated article." }, { status: 500 });
    }
  }

  return Response.json(result, { status: result.ok ? 200 : 400 });
};

export const DELETE: RequestHandler = async (event) => {
  const user = await getUser(event.cookies);
  if (user === null) return error(401, "You must be logged in to delete articles.");
  if (!user.isAdmin) return error(403, "You do not have permission to delete articles.");

  const title = event.params.title;
  await removeFromGraph(title);
  await deleteArticle(title);
  return Response.json({ ok: true }, { status: 200 });
};
