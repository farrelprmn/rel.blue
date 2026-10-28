import { getAchievements, getProjects } from "@/lib/content";
import { DESCRIPTION, SITE_NAME, SITE_URL, SOCIALS } from "@/lib/site";

// /llm.md (and /llms.txt): the whole site as one markdown file for language models, the way
// llms.txt suggests. what the pages are, who it's about, then every project and achievement
// straight from the database, so it never falls behind the dashboard. served through a rewrite
// in next.config.mjs; robots.txt points here

// one line of plain text inside markdown: no line breaks, nothing read as a link or emphasis
const inline = (s) =>
  String(s ?? "")
    .replace(/\s+/g, " ")
    .replace(/([\\`*_[\]<>])/g, "\\$1")
    .trim();

function render(projects, achievements) {
  const out = [];
  const line = (s = "") => out.push(s);

  line(`# ${SITE_NAME}`);
  line();
  line(`> ${DESCRIPTION}`);
  line();
  line(
    `Personal site of Farrel, at ${SITE_URL}. Everything below is generated from the site's database on request, so it matches what the pages show.`,
  );
  line();

  line("## Pages");
  line();
  line(
    `- [Home](${SITE_URL}/): who Farrel is, links to his profiles, and an ASCII cat on a rooftop that visitors can pet. The intro greets by time of day ("Selamat pagi / siang / sore / malam") and shows the local time.`,
  );
  line(
    `- [Projects](${SITE_URL}/projects): ${projects.length} things Farrel has built, one at a time in a carousel, each with a screenshot, its dates, a description and a link when there is one. All listed under Projects below.`,
  );
  line(
    `- [Achievements](${SITE_URL}/achievements): ${achievements.length} competition medals and awards, newest first, with photos for some. All listed under Achievements below.`,
  );
  line(
    "- [Forest](https://forest.rel.blue): a separate site, Farrel's 3D anonymous message forest (see Secret Forest below).",
  );
  line(
    "- /d/login and /d/dashboard: Farrel's private admin for editing projects and achievements. Not public content; please don't index.",
  );
  line();

  line("## About Farrel");
  line();
  line(
    "- Undergraduate at Adelaide University (https://adelaide.edu.au), majoring in cyber security through the trimester pathway, 2026 to now.",
  );
  line(
    "- Research competition mentor at Thursina IIBS (https://thursinaiibs.sch.id), helping students prepare for research competitions, 2025 to now.",
  );
  line("- IoT developer, currently building technology for nature.");
  line(
    `- Profiles: ${SOCIALS.map((s) => `[${s.label}](${s.href})`).join(", ")}`,
  );
  line();

  line("## Projects");
  line();
  for (const p of projects) {
    line(`### ${inline(p.name)}`);
    line();
    if (p.period) line(`- Period: ${inline(p.period)}`);
    if (p.href) line(`- Link: ${p.href}`);
    if (p.image) line(`- Screenshot: ${p.image}`);
    if (p.text) {
      line();
      line(inline(p.text));
    }
    line();
  }

  line("## Achievements");
  line();
  for (const a of achievements) {
    const meta = [a.award, a.year, a.tier && `${a.tier} trophy`]
      .filter(Boolean)
      .map(inline)
      .join(", ");
    line(`### ${inline(a.name)}`);
    line();
    if (meta) line(`- ${meta}`);
    if (a.images.length) line(`- Photos: ${a.images.join(", ")}`);
    if (a.text) {
      line();
      line(inline(a.text));
    }
    line();
  }

  line("---");
  line();
  line(`Generated ${new Date().toISOString()} from ${SITE_URL}.`);
  return `${out.join("\n")}\n`;
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).end();
  }
  try {
    const [projects, achievements] = await Promise.all([
      getProjects(),
      getAchievements(),
    ]);
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    // fresh enough for crawlers without asking the database on every hit
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=3600",
    );
    res.status(200).send(render(projects, achievements));
  } catch (err) {
    console.error("llm.md:", err);
    res.status(503).send("# Farrel's Portofolio\n\nTemporarily unavailable.\n");
  }
}
