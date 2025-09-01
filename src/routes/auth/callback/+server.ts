import { redirect, type RequestHandler } from "@sveltejs/kit";
import { auth0 } from "$lib/api/auth";
import { BASE_URL } from "$env/static/private";

export const GET: RequestHandler = async (event) => {
  await auth0.completeInteractiveLogin(new URL(event.url, BASE_URL), { cookies: event.cookies });
  return redirect(302, "/");
};
