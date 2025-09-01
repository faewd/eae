import { redirect, type RequestHandler } from "@sveltejs/kit";
import { auth0 } from "$lib/api/auth";
import { BASE_URL } from "$env/static/private";

export const GET: RequestHandler = async ({ cookies }) => {
  const logoutUrl = await auth0.logout({ returnTo: BASE_URL }, { cookies });
  return redirect(302, logoutUrl);
};
