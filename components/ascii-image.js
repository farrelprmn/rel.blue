import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const SCRAMBLE = "!<>-_\\/[]{}=+*^?#%@$&";
const SHADES = " .·:-=+*#";
const FPS = 24;

export default function AsciiImage({ className = "", alt, onLoad, ...img }) {
  const [loaded, setLoaded] = useState(false);
  const pre = useRef(null);

  useEffect(() => {
    if (loaded) return;
    const el = pre.current;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = document.createElement("canvas").getContext("2d");
    let cols = 0,
      rows = 0,
      cells = [],
      raf = 0,
      last = 0;
    const start = performance.now();

    const build = () => {
      const cs = getComputedStyle(el);
      ctx.font = `${cs.fontSize} ${cs.fontFamily}`;
      const cw = ctx.measureText("0").width || 7;
      const lh = parseFloat(cs.lineHeight) || 14;
      cols = Math.max(1, Math.floor((el.clientWidth - 16) / cw));
      rows = Math.max(1, Math.floor((el.clientHeight - 12) / lh));
      cells = Array.from({ length: cols * rows }, (_, i) => {
        const x = i % cols,
          y = (i / cols) | 0;
        const at = (x / cols) * 0.55 + (y / rows) * 0.15 + Math.random() * 0.35;
        return {
          at,
          settle: at + 0.2 + Math.random() * 0.25,
          n: Math.random(),
        };
      });
      if (reduce && last) {
        last = 0;
        raf = requestAnimationFrame(draw);
      }
    };

    const draw = (now) => {
      raf = requestAnimationFrame(draw);
      if (now - last < 1000 / FPS) return;
      last = now;
      const t = reduce ? 99 : (now - start) / 1000;
      const phase = ((t - 1) * 0.3) % 1.3;
      let out = "";
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const c = cells[y * cols + x];
          if (t < c.at) out += " ";
          else if (t < c.settle)
            out += SCRAMBLE[(Math.random() * SCRAMBLE.length) | 0];
          else {
            const d = (x / cols) * 0.75 + (y / rows) * 0.25 - phase + 0.15;
            const band =
              t > 1 && !reduce ? Math.max(0, 1 - Math.abs(d) * 7) : 0;
            const v = Math.min(0.999, c.n * 0.45 + band * 0.75);
            out += SHADES[(v * SHADES.length) | 0];
          }
        }
        out += "\n";
      }
      el.textContent = out;
      if (reduce) cancelAnimationFrame(raf);
    };

    build();
    raf = requestAnimationFrame(draw);
    document.fonts?.ready.then(build);
    const ro = new ResizeObserver(build);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [loaded]);

  if (!img.src)
    return (
      <div className={`${className} ascii-img`} role="img" aria-label={alt}>
        <pre ref={pre} className="ascii-skeleton" aria-hidden="true" />
      </div>
    );

  return (
    <div className={`${className} ascii-img${loaded ? " loaded" : ""}`}>
      <pre ref={pre} className="ascii-skeleton" aria-hidden="true" />
      <Image
        {...img}
        alt={alt}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        onError={() => setLoaded(true)}
      />
    </div>
  );
}
