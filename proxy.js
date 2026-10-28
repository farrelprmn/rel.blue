import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isDashboard = createRouteMatcher(["/d/dashboard(.*)"]);
const isLogin = createRouteMatcher(["/d/login"]);

export default clerkMiddleware(async (auth, req) => {
  if (isDashboard(req)) {
    await auth.protect({
      unauthenticatedUrl: new URL("/d/login", req.url).toString(),
    });
  }
  if (isLogin(req) && (await auth()).userId) {
    return NextResponse.redirect(new URL("/d/dashboard", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
