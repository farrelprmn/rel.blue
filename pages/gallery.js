import Seo from "@/components/seo";

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
