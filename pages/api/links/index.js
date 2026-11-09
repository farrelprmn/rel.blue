import { failed, notAllowed, signedIn } from "@/lib/api";
import { getLinks, saveLink } from "@/lib/links";

export default async function handler(req, res) {
  if (!signedIn(req, res)) return;
  try {
    if (req.method === "GET") return res.status(200).json(await getLinks());
    if (req.method === "POST")
      return res.status(201).json(await saveLink(null, req.body ?? {}));
    notAllowed(res, ["GET", "POST"]);
  } catch (err) {
    failed(res, err);
  }
}
