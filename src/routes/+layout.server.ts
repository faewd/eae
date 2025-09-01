import { getUser } from "$lib/api/auth";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ cookies }) => {
  const user = await getUser(cookies);
  return { user };
};
