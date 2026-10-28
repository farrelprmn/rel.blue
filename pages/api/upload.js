import { randomUUID } from "node:crypto";
import { failed, notAllowed, signedIn } from "@/lib/api";
import { FOLDERS, upload } from "@/lib/s3";

// the file arrives as the raw request body (Content-Type: image/…), not a form, so Next's parser stays off
export const config = { api: { bodyParser: false } };

// under the proxy's 10MB request buffer
const MAX = 8 * 1024 * 1024;
const EXT = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

// POST /api/upload?folder=projects&name=forest.png → { url } of the stored file in rel.blue/<folder>/
export default async function handler(req, res) {
  if (req.method !== "POST") return notAllowed(res, ["POST"]);
  if (!signedIn(req, res)) return;

  const folder = String(req.query.folder);
  if (!FOLDERS.includes(folder))
    return res.status(400).json({ error: "unknown folder" });
  const type = String(req.headers["content-type"] ?? "").split(";")[0];
  const ext = EXT[type];
  if (!ext)
    return res.status(415).json({ error: "png, jpg, webp, gif or avif only" });
  if (Number(req.headers["content-length"]) > MAX)
    return res.status(413).json({ error: "8MB at most" });

  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX) return res.status(413).json({ error: "8MB at most" });
    chunks.push(chunk);
  }
  if (!size) return res.status(400).json({ error: "empty file" });

  // the original name, made URL-safe, plus a short random part so uploads never overwrite each other
  const base =
    String(req.query.name ?? "")
      .replace(/\.[^.]*$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "image";
  const name = `${base}-${randomUUID().slice(0, 8)}.${ext}`;

  try {
    const url = await upload(folder, name, Buffer.concat(chunks), type);
    res.status(201).json({ url });
  } catch (err) {
    failed(res, err);
  }
}
