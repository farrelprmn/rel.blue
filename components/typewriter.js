import { Fragment, useEffect, useState } from "react";

const played = new Set();

const delay = (ch) =>
  ch === "." || ch === "\n" ? 240 : ch === " " ? 35 : 18 + Math.random() * 24;

export default function Typewriter({ text, className, as: Tag = "p" }) {
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
