import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import AsciiImage from "@/components/ascii-image";
import PhotoViewer from "@/components/photo-viewer";
import Typewriter from "@/components/typewriter";
import Seo from "@/components/seo";
import { getAchievements } from "@/lib/content";
import { optimisable } from "@/lib/images";
import { usePhone } from "@/lib/phone";
import { TROPHY } from "@/lib/trophy";

// from the database at build, then again at most once a minute; the dashboard's API also refreshes
// the page straight after each change
export async function getStaticProps() {
  return { props: { achievements: await getAchievements() }, revalidate: 60 };
}

// photos open in a popup on bigger screens; on phones they unfold under the achievement instead,
// as a row you swipe through
export default function Achievements({ achievements }) {
  const phone = usePhone();
  // the achievement whose photos are open, if any
  const [viewing, setViewing] = useState(null);
  return (
    <div className="page center">
      <Seo
        title="Achievements"
        path="/achievements"
        description="Medals and awards Farrel has won in invention, science, IoT and business competitions in Indonesia and abroad, from I2ASPO gold to the World Youth Festival."
      />
      <Typewriter as="h1" text="things i've won" />
      <ul className="award-list">
        {achievements.map((a) => (
          <li key={a.id} className="award">
            <span className="trophy" style={{ color: TROPHY[a.tier] }}>
              <FontAwesomeIcon icon={faTrophy} aria-hidden="true" />
            </span>
            <div>
              <h2>
                {/* nbsp + space: a two-character gap that still breaks cleanly before the meta */}
                {a.name}
                {"  "}
                <span className="meta">
                  {[a.award, a.year].filter(Boolean).join(" · ")}
                </span>
              </h2>
              {a.text && <p>{a.text}</p>}
              {a.images.length > 0 && (
                <button
                  type="button"
                  className="btn see-photos"
                  aria-haspopup={phone ? undefined : "dialog"}
                  aria-expanded={phone ? viewing?.id === a.id : undefined}
                  onClick={() =>
                    setViewing(phone && viewing?.id === a.id ? null : a)
                  }
                >
                  {phone && viewing?.id === a.id
                    ? "hide photos"
                    : `see photos (${a.images.length})`}
                </button>
              )}
              {phone && viewing?.id === a.id && (
                <ul
                  className="photo-strip"
                  aria-label={`Photos from ${a.name}`}
                >
                  {a.images.map((src, i) => (
                    <li key={`${i}-${src}`}>
                      <AsciiImage
                        className="photo-strip-shot"
                        src={src}
                        fill
                        unoptimized={!optimisable(src)}
                        alt={`${a.name}, photo ${i + 1}`}
                        sizes="85vw"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ul>
      {viewing && !phone && (
        <PhotoViewer
          title={viewing.name}
          photos={viewing.images}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
