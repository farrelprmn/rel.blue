import { failed, notAllowed, refresh, signedIn } from "@/lib/api";
import { getProjects, saveProject } from "@/lib/content";

// GET: every project for the dashboard. POST: add one
export default async function handler(req, res) {
  if (!signedIn(req, res)) return;
  try {
    if (req.method === "GET") return res.status(200).json(await getProjects());
    if (req.method === "POST") {
      const item = await saveProject(null, req.body ?? {});
      await refresh(res, "/projects");
      return res.status(201).json(item);
    }
    notAllowed(res, ["GET", "POST"]);
  } catch (err) {
    failed(res, err);
  }
}
