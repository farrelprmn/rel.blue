import db from "@/lib/db";

// projects and achievements in MySQL (presequities/schema.sql), turned into the shapes the pages
// use. the public pages read them at build / revalidate time, the dashboard through /api

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50) || "untitled";

// newest first
export async function getProjects() {
  const [rows] = await db.query(
    "SELECT project_id, project_slug, project_name, project_duration, project_image_link, project_link, project_description FROM projects ORDER BY `timestamp` DESC, project_id DESC",
  );
  return rows.map((r) => ({
    id: r.project_id,
    slug: r.project_slug || slugify(r.project_name),
    name: r.project_name,
    period: r.project_duration ?? "",
    image: r.project_image_link ?? "",
    href: r.project_link ?? "",
    text: r.project_description ?? "",
  }));
}

// newest year first, then in the order they were added
export async function getAchievements() {
  const [rows] = await db.query(
    "SELECT achievements_id, achievements_name, achievements_award, achievements_tier, achievements_year, achievements_desc FROM achievements ORDER BY achievements_year DESC, achievements_id ASC",
  );
  const [images] = await db.query(
    "SELECT achievements_id, image_url FROM achievements_image ORDER BY image_id",
  );
  return rows.map((r) => ({
    id: r.achievements_id,
    name: r.achievements_name,
    award: r.achievements_award ?? "",
    tier: r.achievements_tier,
    year: r.achievements_year ?? "",
    text: r.achievements_desc ?? "",
    images: images
      .filter((i) => i.achievements_id === r.achievements_id)
      .map((i) => i.image_url),
  }));
}

// form values (strings) → checked column values; throws a message the dashboard can show
const text = (v, max, label) => {
  const s = String(v ?? "").trim();
  if (max && s.length > max)
    throw new Error(`${label} is over ${max} characters`);
  return s;
};

export async function saveProject(id, data) {
  const name = text(data.name, 50, "name");
  if (!name) throw new Error("name is required");
  const values = [
    name,
    text(data.slug, 50, "slug") || slugify(name),
    text(data.period, 50, "duration") || null,
    text(data.image) || null,
    text(data.href) || null,
    text(data.text) || null,
  ];
  if (id == null) {
    const [r] = await db.execute(
      "INSERT INTO projects (project_name, project_slug, project_duration, project_image_link, project_link, project_description) VALUES (?, ?, ?, ?, ?, ?)",
      values,
    );
    id = r.insertId;
  } else {
    const [r] = await db.execute(
      "UPDATE projects SET project_name = ?, project_slug = ?, project_duration = ?, project_image_link = ?, project_link = ?, project_description = ? WHERE project_id = ?",
      [...values, id],
    );
    if (!r.affectedRows) throw new Error("project not found");
  }
  return (await getProjects()).find((p) => p.id === Number(id));
}

export async function deleteProject(id) {
  await db.execute("DELETE FROM projects WHERE project_id = ?", [id]);
}

export async function saveAchievement(id, data) {
  const name = text(data.name, 100, "name");
  if (!name) throw new Error("name is required");
  const tier = data.tier === "silver" ? "silver" : "gold";
  const yearText = text(data.year);
  const year = yearText ? Number(yearText) : null;
  if (year != null && !(Number.isInteger(year) && year >= 1901 && year <= 2155))
    throw new Error("year must be between 1901 and 2155");
  // one link per line (the dashboard's images box), or an array
  const images = (
    Array.isArray(data.images)
      ? data.images
      : String(data.images ?? "").split("\n")
  )
    .map((s) => s.trim())
    .filter(Boolean);
  const values = [
    name,
    text(data.award, 100, "award") || null,
    tier,
    year,
    text(data.text) || null,
  ];

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    if (id == null) {
      const [r] = await conn.execute(
        "INSERT INTO achievements (achievements_name, achievements_award, achievements_tier, achievements_year, achievements_desc) VALUES (?, ?, ?, ?, ?)",
        values,
      );
      id = r.insertId;
    } else {
      const [r] = await conn.execute(
        "UPDATE achievements SET achievements_name = ?, achievements_award = ?, achievements_tier = ?, achievements_year = ?, achievements_desc = ? WHERE achievements_id = ?",
        [...values, id],
      );
      if (!r.affectedRows) throw new Error("achievement not found");
      await conn.execute(
        "DELETE FROM achievements_image WHERE achievements_id = ?",
        [id],
      );
    }
    for (const url of images) {
      await conn.execute(
        "INSERT INTO achievements_image (achievements_id, image_url) VALUES (?, ?)",
        [id, url],
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return (await getAchievements()).find((a) => a.id === Number(id));
}

// its images go with it (ON DELETE CASCADE)
export async function deleteAchievement(id) {
  await db.execute("DELETE FROM achievements WHERE achievements_id = ?", [id]);
}
