import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import AsciiImage from "@/components/ascii-image";
import Carousel from "@/components/carousel";
import Typewriter from "@/components/typewriter";
import Seo from "@/components/seo";
import { getProjects } from "@/lib/content";
import { optimisable } from "@/lib/images";

// from the database at build, then again at most once a minute; the dashboard's API also refreshes
// the page straight after each change
export async function getStaticProps() {
  return { props: { projects: await getProjects() }, revalidate: 60 };
}

const pad = (n) => String(n).padStart(2, "0");

// replaces its text in place whenever `k` changes: old and new are stacked in one grid cell and
// cross-blur, so the spot is never empty
function Swap({ k, children, end }) {
  const reduce = useReducedMotion();
  const hidden = { opacity: 0, filter: reduce ? "blur(0px)" : "blur(4px)" };
  return (
    <span className={end ? "swap end" : "swap"}>
      <AnimatePresence initial={false}>
        <motion.span
          key={k}
          initial={hidden}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          exit={hidden}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function Projects({ projects }) {
  const [active, setActive] = useState(0);
  return (
    <div className="page center">
      <Seo
        title="Projects"
        path="/projects"
        description="Things Farrel has built: EcoTrace, a 3D emission calculator; Secret Forest, an anonymous message forest in the browser; Missecret; and BotanIQ, a smart plant pot."
      />
      <Typewriter as="h1" text="things i've built" />
      {/* 01 / 04 ─ ─ ─ ─ mar 2026 – apr 2026: stays put over the track, only the values swap */}
      <div className="project-rule">
        <span className="project-no">
          <Swap k={active}>{pad(active + 1)}</Swap>
          <span className="project-of"> / {pad(projects.length)}</span>
        </span>
        {/* the dashes always run to the edge; the period sits over their right end on a patch of
            page background, so as periods cross-blur the covered dashes just fade back in */}
        <span className="project-tail">
          <span className="project-line" aria-hidden="true" />
          <Swap k={active} end>
            {projects[active]?.period}
          </Swap>
        </span>
      </div>
      <Carousel label="Projects" onIndex={setActive}>
        {projects.map((p, i) => (
          <article key={p.id} className="project">
            {/* same window chrome as the info card, toned down to the page greys */}
            <figure className="project-window">
              <figcaption className="project-bar">
                <span className="project-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span>~/projects/{p.slug}</span>
              </figcaption>
              {/* no screenshot yet: the ASCII skeleton just keeps running in its place */}
              <AsciiImage
                className="project-shot"
                src={p.image || null}
                fill
                unoptimized={!p.image || !optimisable(p.image)}
                alt={p.image ? `Screenshot of ${p.name}` : "No screenshot yet"}
                sizes="(max-width: 700px) 100vw, 640px"
                priority={i === 0}
              />
            </figure>
            <h2>{p.name}</h2>
            <p>{p.text}</p>
            {p.href && (
              <a
                className="u project-link"
                href={p.href}
                target="_blank"
                rel="noopener"
              >
                view project <span aria-hidden="true">↗</span>
              </a>
            )}
          </article>
        ))}
      </Carousel>
    </div>
  );
}
