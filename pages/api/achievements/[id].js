import { failed, notAllowed, refresh, signedIn } from "@/lib/api";
import { deleteAchievement, saveAchievement } from "@/lib/content";

export default async function handler(req, res) {
  if (!signedIn(req, res)) return;
  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id < 1)
    return res.status(400).json({ error: "bad id" });
  try {
    if (req.method === "PUT") {
      const item = await saveAchievement(id, req.body ?? {});
      await refresh(res, "/achievements");
      return res.status(200).json(item);
    }
    if (req.method === "DELETE") {
      await deleteAchievement(id);
      await refresh(res, "/achievements");
      return res.status(204).end();
    }
    notAllowed(res, ["PUT", "DELETE"]);
  } catch (err) {
    failed(res, err);
  }
}
