import Seo from "@/components/seo";

// placeholder entries; give each one a `src` (e.g. a file in /public) to show the picture
const PHOTOS = [
  { caption: "photo one" },
  { caption: "photo two" },
  { caption: "photo three" },
  { caption: "photo four" },
];

export default function Gallery() {
  return (
    <div className="page">
      <Seo title="Gallery" path="/gallery" />
      <h1>things i&apos;ve seen</h1>
      <ul className="gallery">
        {PHOTOS.map((p) => (
          <li key={p.caption}>
            <figure>
              {p.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.src} alt={p.caption} loading="lazy" />
              ) : (
                <div className="gallery-empty" aria-hidden="true" />
              )}
              <figcaption>{p.caption}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </div>
  );
}
