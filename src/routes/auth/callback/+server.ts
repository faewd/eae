import { redirect, type RequestHandler } from "@sveltejs/kit";
import { auth0 } from "$lib/api/auth";
import { env } from "$env/dynamic/private";

export const GET: RequestHandler = async (event) => {
  await auth0.completeInteractiveLogin(new URL(event.url, env.BASE_URL), {
    cookies: event.cookies,
  });
  return redirect(302, "/");
};
