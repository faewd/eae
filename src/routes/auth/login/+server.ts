import { redirect, type RequestHandler } from "@sveltejs/kit";
import { auth0 } from "$lib/api/auth";

export const GET: RequestHandler = async ({ cookies }) => {
  const authUrl = await auth0.startInteractiveLogin({}, { cookies });
  return redirect(302, authUrl);
};
