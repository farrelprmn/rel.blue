import { failed, notAllowed, refresh, signedIn } from "@/lib/api";
import { deleteProject, saveProject } from "@/lib/content";

// PUT: change one project. DELETE: remove it
export default async function handler(req, res) {
  if (!signedIn(req, res)) return;
  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id < 1)
    return res.status(400).json({ error: "bad id" });
  try {
    if (req.method === "PUT") {
      const item = await saveProject(id, req.body ?? {});
      await refresh(res, "/projects");
      return res.status(200).json(item);
    }
    if (req.method === "DELETE") {
      await deleteProject(id);
      await refresh(res, "/projects");
      return res.status(204).end();
    }
    notAllowed(res, ["PUT", "DELETE"]);
  } catch (err) {
    failed(res, err);
  }
}
