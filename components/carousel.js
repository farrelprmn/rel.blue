import { animate } from "motion/react";
import { Children, useCallback, useEffect, useRef, useState } from "react";

// one slide at a time on a scroll-snap track (so touch swipes and trackpads just work), with dots
// and arrows under it. it moves on by itself every `every` ms (0: never), but holds still while the
// pointer or focus is on it, and never for prefers-reduced-motion. `onIndex` hears which slide is showing,
// for anything outside the track that follows along
export default function Carousel({ children, label, every = 6000, onIndex }) {
  const track = useRef(null);
  const slides = Children.toArray(children);
  const n = slides.length;
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    onIndex?.(index);
  }, [index, onIndex]);

  // one step slides; anything farther (4 → 1 wrapping round, or a far dot) blurs out, jumps
  // straight there and blurs back in, instead of scrolling past every slide in between
  const jumping = useRef(false);
  const go = useCallback(
    (i) => {
      const el = track.current;
      if (!el || jumping.current) return;
      const to = (i + n) % n;
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce || Math.abs(to - index) <= 1) {
        el.scrollTo({
          left: to * el.clientWidth,
          behavior: reduce ? "auto" : "smooth",
        });
        return;
      }
      jumping.current = true;
      animate(el, { opacity: 0, filter: "blur(6px)" }, { duration: 0.25 })
        .then(() => {
          el.scrollTo({ left: to * el.clientWidth, behavior: "auto" });
          return animate(
            el,
            { opacity: 1, filter: "blur(0px)" },
            { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
          );
        })
        .then(() => {
          el.style.removeProperty("opacity");
          el.style.removeProperty("filter");
          jumping.current = false;
        });
    },
    [index, n],
  );

  // the dot follows the scroll position, however the track got there
  const onScroll = () => {
    const el = track.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  useEffect(() => {
    if (
      !every ||
      n < 2 ||
      held ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    // restarts on every slide change, so a manual move gets a full interval before the next one
    const t = setTimeout(() => go(index + 1), every);
    return () => clearTimeout(t);
  }, [index, held, n, every, go]);

  return (
    <section
      className="carousel"
      aria-roledescription="carousel"
      aria-label={label}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      <ol
        ref={track}
        className="carousel-track"
        tabIndex={0}
        onScroll={onScroll}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(index + 1);
          else if (e.key === "ArrowLeft") go(index - 1);
          else return;
          e.preventDefault();
        }}
      >
        {slides.map((slide, i) => (
          <li
            key={i}
            className="carousel-slide"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${n}`}
            aria-hidden={i !== index}
            inert={i !== index}
          >
            {slide}
          </li>
        ))}
      </ol>
      {n > 1 && (
        <div className="carousel-nav">
          <button
            type="button"
            className="carousel-arrow"
            aria-label="Previous"
            onClick={() => go(index - 1)}
          >
            ←
          </button>
          <div className="carousel-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                className="carousel-dot"
                aria-label={`Go to ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className="carousel-arrow"
            aria-label="Next"
            onClick={() => go(index + 1)}
          >
            →
          </button>
        </div>
      )}
    </section>
  );
}
