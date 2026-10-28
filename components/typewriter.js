import { Fragment, useEffect, useState } from "react";

// types `text` out once per visit behind a terminal-style block caret; "\n" breaks the line.
// untyped characters are already laid out, only transparent, so the line widths the cat
// measures to stand on never change, and screen readers get the whole sentence from the start
// (once per text, so each page's heading gets its own first time)
const played = new Set();

// pause after typing `ch`: a beat at the end of a sentence, quick over spaces, a little jitter otherwise
const delay = (ch) =>
  ch === "." || ch === "\n" ? 240 : ch === " " ? 35 : 18 + Math.random() * 24;

export default function Typewriter({ text, className, as: Tag = "p" }) {
  // the server and hydration render nothing typed; coming back to the page shows it all
  const [n, setN] = useState(() => (played.has(text) ? text.length : 0));

  useEffect(() => {
    if (played.has(text)) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let i = 0,
      t;
    const step = () => {
      i = reduce ? text.length : i + 1;
      setN(i);
      if (i >= text.length) played.add(text);
      else t = setTimeout(step, delay(text[i - 1]));
    };
    // starts once the page's blur-in is mostly through
    t = setTimeout(step, reduce ? 0 : 800);
    return () => clearTimeout(t);
  }, [text]);

  const lines = text.split("\n");
  const starts = lines.map((_, li) =>
    lines.slice(0, li).reduce((s, l) => s + l.length + 1, 0),
  );
  return (
    <Tag className={className}>
      {lines.map((line, li) => {
        const typed = Math.max(0, n - starts[li]);
        return (
          <Fragment key={li}>
            {li > 0 && <br />}
            {line.slice(0, typed)}
            {n >= starts[li] && n <= starts[li] + line.length && (
              <span
                className={n >= text.length ? "caret idle" : "caret"}
                aria-hidden="true"
              />
            )}
            <span className="untyped">{line.slice(typed)}</span>
          </Fragment>
        );
      })}
    </Tag>
  );
}
