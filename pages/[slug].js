import { findDestination, SLUG } from "@/lib/links";

// rel.blue/<slug> short links (managed in /d/dashboard). Pages, public files and the
// llms.txt rewrite are all matched before this dynamic route, so it only sees leftover paths.
// Never listed anywhere public, and the redirect tells crawlers not to index the short url.
export async function getServerSideProps({ params, res }) {
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  const slug = String(params.slug).toLowerCase();
  if (!SLUG.test(slug)) return { notFound: true };

  const destination = await findDestination(slug);
  if (!destination) return { notFound: true };

  res.setHeader("Cache-Control", "private, no-store");
  return { redirect: { destination, statusCode: 302 } };
}

export default function ShortLink() {
  return null;
}
