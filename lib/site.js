// facts about the site shared by the pages, the share cards (components/seo.js) and /llm.md

// where the site lives in public; share cards, canonical links and /llm.md need full URLs
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://rel.blue"
).replace(/\/$/, "");

export const SITE_NAME = "Farrel's Portofolio";

export const DESCRIPTION =
  "IoT developer and cyber security student at Adelaide University, building technology for nature. See Farrel's projects, awards, and the cat on the rooftop.";

export const SOCIALS = [
  { href: "https://github.com/farrelprmn", label: "github" },
  { href: "https://www.linkedin.com/in/farrelprmn/", label: "linkedin" },
  { href: "https://www.instagram.com/farrelprmn._/", label: "instagram" },
];
