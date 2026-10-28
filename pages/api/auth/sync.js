import { getAuth } from "@clerk/nextjs/server";
import db from "@/lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method not allowed" });
  }
  const { userId, sessionId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "not signed in" });

  try {
    await db.execute(
      "INSERT INTO `user` (clerk_user, token) VALUES (?, ?) ON DUPLICATE KEY UPDATE token = ?",
      [userId, sessionId, sessionId],
    );
  } catch (err) {
    console.error("auth/sync:", err);
    return res.status(500).json({ error: "could not save the login" });
  }
  res.status(200).json({ clerk_user: userId, token: sessionId });
}
