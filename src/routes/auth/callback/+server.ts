import { redirect, type RequestHandler } from "@sveltejs/kit";
import { auth0 } from "$lib/api/auth";
import { env } from "$env/dynamic/private";

export const GET: RequestHandler = async (event) => {
  const url = new URL(event.url.pathname, env.BASE_URL);
  url.search = event.url.search;
  await auth0.completeInteractiveLogin(url, {
    cookies: event.cookies,
  });
  return redirect(302, "/");
};
