import { Fragment } from "react";
import { JumpCounter, PetButton } from "@/components/cat/controls";
import SceneCanvas from "@/components/cat/scene-canvas";
import { Clock, Greeting } from "@/components/time";
import Typewriter from "@/components/typewriter";
import { SOCIALS } from "@/lib/site";
import Seo from "@/components/seo";

export default function Home() {
  return (
    <>
      <Seo person />

      <SceneCanvas />

      <div className="col">
        <section className="intro">
          <Typewriter
            className="tagline"
            text={"every developer needs a cat.\nthis one's mine."}
          />
          {/* links with data-role get an info card; data-period (e.g. "2024 – now") and data-text are optional */}
          <div className="about">
            <p>
              Hello, Selamat <Greeting />, I&apos;m Farrel.
            </p>
            <p>
              IoT developer &amp; student @{" "}
              <a
                className="u"
                href="https://adelaide.edu.au"
                target="_blank"
                rel="noopener"
                data-role="Adelaide University Undergraduate Student"
                data-period="2026 – now"
                data-text="Currently pursuing cyber security major via trimester pathway."
              >
                Adelaide University
              </a>
            </p>
            <p>currently building technology for nature</p>
            <p>
              actively helping students @{" "}
              <a
                className="u"
                href="https://thursinaiibs.sch.id"
                target="_blank"
                rel="noopener"
                data-role="Research Competition Mentor"
                data-period="2025 – now"
                data-text="Helping students prepare for research competitions."
              >
                Thursina IIBS
              </a>{" "}
              for research competitions
            </p>
          </div>
          <div className="links">
            {SOCIALS.map(({ href, label }, i) => (
              <Fragment key={label}>
                {i > 0 && <span>/</span>}
                <a className="u" href={href} target="_blank" rel="noopener">
                  {label}
                </a>
              </Fragment>
            ))}
          </div>
          <p className="hint">
            <PetButton /> · jumps×
            <JumpCounter /> · <Clock />
          </p>
        </section>
      </div>
    </>
  );
}
