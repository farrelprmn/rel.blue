import { getAuth } from "@clerk/nextjs/server";
import db from "@/lib/db";

// called by the dashboard once Clerk has signed someone in: whoever Clerk accepted goes into the
// `user` table (presequities/schema.sql), and the token comes back in the response.
// the token is the Clerk session id (sess_…): the session JWT itself lives for a minute and is longer
// than the varchar(100) column, while the session id names this login for as long as it lasts
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
