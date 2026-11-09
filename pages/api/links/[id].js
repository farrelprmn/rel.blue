import { failed, notAllowed, signedIn } from "@/lib/api";
import { deleteLink, saveLink } from "@/lib/links";

export default async function handler(req, res) {
  if (!signedIn(req, res)) return;
  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id < 1)
    return res.status(400).json({ error: "bad id" });
  try {
    if (req.method === "PUT")
      return res.status(200).json(await saveLink(id, req.body ?? {}));
    if (req.method === "DELETE") {
      await deleteLink(id);
      return res.status(204).end();
    }
    notAllowed(res, ["PUT", "DELETE"]);
  } catch (err) {
    failed(res, err);
  }
}
