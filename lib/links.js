import { randomBytes } from "node:crypto";
import db from "@/lib/db";

// rel.blue/<slug>: lowercase letters, digits and dashes, no dash at either end
export const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/;

// paths the site already uses: pages and public files win over a short link, so these could never redirect
const RESERVED = new Set([
  "api",
  "d",
  "projects",
  "achievements",
  "gallery",
  "index",
  "404",
  "500",
]);

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const randomSlug = () =>
  Array.from(randomBytes(6), (b) => ALPHABET[b % ALPHABET.length]).join("");

const shape = (r) => ({
  id: r.link_id,
  title: r.link_title,
  slug: r.link_slug,
  destination: r.link_destination,
});

export async function getLinks() {
  const [rows] = await db.query(
    "SELECT link_id, link_title, link_slug, link_destination FROM links ORDER BY created_at DESC, link_id DESC",
  );
  return rows.map(shape);
}

export async function findDestination(slug) {
  const [rows] = await db.execute(
    "SELECT link_destination FROM links WHERE link_slug = ? LIMIT 1",
    [slug],
  );
  return rows[0]?.link_destination ?? null;
}

const text = (v) => String(v ?? "").trim();

export async function saveLink(id, data) {
  const title = text(data.title);
  if (!title) throw new Error("title is required");
  if (title.length > 100) throw new Error("title is over 100 characters");

  const destination = text(data.destination);
  if (!destination) throw new Error("destination is required");
  let url;
  try {
    url = new URL(destination);
  } catch {
    throw new Error("destination must be a full http(s) link");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:")
    throw new Error("destination must be a full http(s) link");

  let slug = text(data.slug).replace(/^\/+/, "").toLowerCase();
  if (slug && !SLUG.test(slug))
    throw new Error(
      "link must be 1 to 50 characters: a-z, 0-9 and dashes, not starting or ending with a dash",
    );
  if (RESERVED.has(slug)) throw new Error(`/${slug} is reserved by the site`);
  const random = !slug;

  for (let attempt = 0; ; attempt++) {
    if (random) slug = randomSlug();
    try {
      if (id == null) {
        const [r] = await db.execute(
          "INSERT INTO links (link_title, link_slug, link_destination) VALUES (?, ?, ?)",
          [title, slug, url.href],
        );
        id = r.insertId;
      } else {
        const [r] = await db.execute(
          "UPDATE links SET link_title = ?, link_slug = ?, link_destination = ? WHERE link_id = ?",
          [title, slug, url.href, id],
        );
        if (!r.affectedRows) throw new Error("link not found");
      }
      break;
    } catch (err) {
      if (err.code !== "ER_DUP_ENTRY") throw err;
      if (!random || attempt >= 4)
        throw new Error(`/${slug} is already taken`);
    }
  }
  return { id: Number(id), title, slug, destination: url.href };
}

export async function deleteLink(id) {
  await db.execute("DELETE FROM links WHERE link_id = ?", [id]);
}
