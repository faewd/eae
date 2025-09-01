import { getArticle } from "$lib/api/storage";
import type { PageServerLoad } from "./$types";
import { error, redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ params, parent }) => {
  const { user } = await parent();

  if (user === null) return error(401, "You must be logged in to create articles.");
  if (!user.isAdmin) return error(403, "You do not have permission to create articles.");

  const readResult = await getArticle(params.title);
  if (readResult.ok) return redirect(302, `/edit/${params.title}`);
};
