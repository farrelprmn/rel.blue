import { getAuth } from "@clerk/nextjs/server";

export function signedIn(req, res) {
  const { userId } = getAuth(req);
  if (!userId) res.status(401).json({ error: "not signed in" });
  return userId;
}

export function notAllowed(res, methods) {
  res.setHeader("Allow", methods.join(", "));
  res.status(405).json({ error: "method not allowed" });
}

export function failed(res, err) {
  const known = /required|over \d+ characters|between|not found/.test(
    err.message,
  );
  if (!known) console.error(err);
  res
    .status(known ? 400 : 500)
    .json({ error: known ? err.message : "something went wrong" });
}

export async function refresh(res, path) {
  try {
    await res.revalidate(path);
  } catch (err) {
    console.error(`revalidate ${path}:`, err);
  }
}
