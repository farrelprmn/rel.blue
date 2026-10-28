import { useEffect, useRef } from "react";
import { isLeaving } from "../navigation";
import {
  canvasFont,
  drawScene,
  fitCanvas,
  fontReady,
  makeStars,
} from "./scene";

export default function SceneCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const family = canvasFont(cv);
    let g = null,
      stars = [],
      raf = 0,
      rt = 0,
      live = true;

    const fit = () => {
      g = fitCanvas(cv, ctx, family);
      stars = makeStars(g);
    };
    const frame = (ms) => {
      if (g && !isLeaving()) {
        ctx.clearRect(0, 0, g.W, g.H);
        drawScene(ctx, g, stars, ms / 1000, reduce);
      }
      raf = requestAnimationFrame(frame);
    };
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(fit, 80);
    };
    addEventListener("resize", onResize);
    fontReady(family).then(() => {
      if (!live) return;
      fit();
      raf = requestAnimationFrame(frame);
    });

    return () => {
      live = false;
      removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
      clearTimeout(rt);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" />;
}
