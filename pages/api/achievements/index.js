import { failed, notAllowed, refresh, signedIn } from "@/lib/api";
import { getAchievements, saveAchievement } from "@/lib/content";

export default async function handler(req, res) {
  if (!signedIn(req, res)) return;
  try {
    if (req.method === "GET")
      return res.status(200).json(await getAchievements());
    if (req.method === "POST") {
      const item = await saveAchievement(null, req.body ?? {});
      await refresh(res, "/achievements");
      return res.status(201).json(item);
    }
    notAllowed(res, ["GET", "POST"]);
  } catch (err) {
    failed(res, err);
  }
}
