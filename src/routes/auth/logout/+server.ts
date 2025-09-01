import { redirect, type RequestHandler } from "@sveltejs/kit";
import { auth0 } from "$lib/api/auth";
import { env } from "$env/dynamic/private";

export const GET: RequestHandler = async ({ cookies }) => {
  const logoutUrl = await auth0.logout({ returnTo: env.BASE_URL }, { cookies });
  return redirect(302, logoutUrl);
};
