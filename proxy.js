import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPrivate = createRouteMatcher(["/d/(.*)"]);
const isDashboard = createRouteMatcher(["/d/dashboard(.*)"]);
const isLogin = createRouteMatcher(["/d/login"]);

const fresh = (res) => {
  res.headers.set("x-middleware-cache", "no-cache");
  return res;
};

export default clerkMiddleware(async (auth, req) => {
  if (!isPrivate(req)) return;
  const { userId } = await auth();
  const pageLoad = !req.headers.has("x-nextjs-data");

  if (isDashboard(req) && !userId) {
    return fresh(NextResponse.redirect(new URL("/d/login", req.url)));
  }
  if (isLogin(req) && userId && pageLoad) {
    return fresh(NextResponse.redirect(new URL("/d/dashboard", req.url)));
  }
  return fresh(NextResponse.next());
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
