import { getUser } from "$lib/api/auth";
import { parse } from "$lib/article/parse";
import { error, type RequestHandler } from "@sveltejs/kit";
import dedent from "dedent";
import * as db from "$lib/api/db";

export const POST: RequestHandler = async (event) => {
  const user = await getUser(event.cookies);
  if (user === null) return error(401, "You must be logged in to edit articles.");
  if (!user.isAdmin) return error(403, "You do not have permission to edit articles.");

  const { title } = await event.request.json();

  const writeResult = await db.writeArticle(title, makeDefaultArticle(title));

  if (writeResult.ok) {
    try {
      const article = await parse(writeResult.content, db);
      const mergeResult = await db.mergeIntoGraph(article, title);
      if (!mergeResult.ok) {
        console.error(mergeResult);
        return Response.json({ error: "Failed to add new article to graph." }, { status: 500 });
      }
    } catch (err) {
      console.error(err);
      return Response.json({ error: "Failed to parse new article." }, { status: 500 });
    }
  }

  return Response.json(writeResult, { status: writeResult.ok ? 200 : 400 });
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
