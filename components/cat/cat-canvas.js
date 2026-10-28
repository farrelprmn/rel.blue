import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { addJump, onExit, onPet } from "./controls";
import { drawDust, drawMarks, drawWords } from "./effects";
import { clamp } from "./geometry";
import { findPlatforms, pickPlat, textRight } from "./platforms";
import { canvasFont, fitCanvas, fontReady } from "./scene";
import { catAt, drawCat } from "./sprite";

const G = 2600;
const EXIT_CROUCH = 0.32,
  EXIT_RISE = 0.6;

const leaving = (s) => s === "exitCrouch" || s === "exit";

export default function CatCanvas() {
  const ref = useRef(null);
  const setHome = useRef(null);
  const { pathname } = useRouter();

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;

    const ac = new AbortController();
    const { signal } = ac;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const family = canvasFont(cv);

    let g = fitCanvas(cv, ctx, family);
    let plats = [];
    const pointer = { x: 0, y: 0, has: false, last: -1e9 };
    const look = { x: 0, y: 0 };
    const cat = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      vy0: 0,
      landX: 0,
      landY: 0,
      dir: -1,
      state: "gone",
      t0: 0,
      target: null,
      flipT: 0,
    };
    let nextBlink = 2,
      blinkStart = -9,
      slowBlink = false,
      twitchT = -9,
      nextTwitch = 4,
      purrT = -9,
      exitDone = null,
      arc = null,
      ready = false,
      atHome = false,
      introT = 0;
    const marks = [],
      dust = [],
      words = [];
    let S = {
      t: 0,
      look,
      lid: 0,
      pitch: 0,
      e: 1,
      dy: 0,
      wiggle: 0,
      happy: false,
      chill: 0.28,
      pose: "sit",
      twitch: 0,
      tailSwish: 1,
      tailLift: 1,
    };

    const homeX = () => {
      const lo = 14 * g.cell,
        hi = g.W - 14 * g.cell,
        beside = textRight() + 14 * g.cell;
      if (beside <= hi)
        return Math.min(hi, Math.max(beside, g.W * (g.mobile ? 0.62 : 0.72)));
      return clamp(g.W * 0.62, lo, hi);
    };

    const fit = (rehome = false) => {
      const prevW = g.W;
      g = fitCanvas(cv, ctx, family);
      if (cat.state === "gone" || leaving(cat.state)) return;
      plats = findPlatforms(g);
      if (cat.y) {
        cat.y = 0;
        cat.state = "sit";
      }
      cat.x =
        rehome || g.W !== prevW
          ? homeX()
          : clamp(cat.x, 14 * g.cell, g.W - 14 * g.cell);
    };

    setHome.current = (home) => {
      atHome = home;
      if (!home) {
        clearTimeout(introT);
        if (!leaving(cat.state)) cat.state = "gone";
        return;
      }
      if (ready) comeHome();
    };

    const comeHome = () => {
      if (cat.state !== "gone") return;
      Object.assign(cat, {
        x: homeX(),
        y: 0,
        vx: 0,
        vy: 0,
        dir: -1,
        state: "sit",
        target: null,
        flipT: 0,
      });
      plats = findPlatforms(g);
      if (!reduce) enter();
    };

    const enter = () => {
      const apexY = -8 * g.cell;
      cat.y = g.H - g.groundRow * g.cell + 22 * g.cell;
      const tUp = Math.sqrt((2 * (cat.y - apexY)) / G);
      cat.vy = -G * tUp;
      cat.vy0 = cat.vy;
      cat.vx = 0;
      cat.landX = cat.x;
      cat.landY = 0;
      cat.state = "leap";
      cat.t0 = performance.now() / 1000;
    };

    const jumpTo = (tx, ty) => {
      if (cat.state !== "sit") return;
      const gy = g.groundRow * g.cell,
        margin = 14 * g.cell;
      let land = {
        x: clamp(tx + (tx - cat.x) * 0.25, margin, g.W - margin),
        y: 0,
      };
      plats = findPlatforms(g);
      const p = pickPlat(plats, tx, ty);
      if (p) {
        const pad = 3 * g.cell;
        land = {
          x:
            p.x2 - p.x1 > 2 * pad
              ? clamp(tx, p.x1 + pad, p.x2 - pad)
              : (p.x1 + p.x2) / 2,
          y: p.top - gy,
          plat: true,
        };
      }
      const d = land.x - cat.x;
      if (Math.abs(d) > 20) cat.dir = d > 0 ? 1 : -1;
      cat.target = { x: tx, y: ty, land };
      cat.state = "crouch";
      cat.t0 = performance.now() / 1000;
      marks.push({ x: tx, y: ty, t0: cat.t0 });
    };

    const launch = (t) => {
      if (!cat.target) return;
      const gy = g.groundRow * g.cell,
        land = cat.target.land;
      const y0 = cat.y,
        y1 = land.y,
        cy = clamp(cat.target.y - gy, -gy, 0);
      let apexY = Math.min(
        Math.min(y0, y1, cy) - (land.plat ? 45 : 20),
        Math.min(y0, y1) - 60,
      );
      apexY = Math.max(apexY, -(gy - 23 * g.cell));
      const tUp = Math.sqrt((2 * Math.max(1, y0 - apexY)) / G),
        tDown = Math.sqrt((2 * Math.max(1, y1 - apexY)) / G);
      cat.vy = -G * tUp;
      cat.vx = (land.x - cat.x) / (tUp + tDown);
      cat.vy0 = cat.vy;
      cat.landX = land.x;
      cat.landY = y1;
      if (Math.abs(cat.vx) > 1) cat.dir = cat.vx > 0 ? 1 : -1;
      cat.state = "leap";
      cat.t0 = t;
      addJump();
    };

    const startExit = (t) => {
      const top = g.H / 2 + 7 * g.cell - g.groundRow * g.cell,
        rise = Math.max(4 * g.cell, cat.y - top),
        grav = (2 * rise) / EXIT_RISE ** 2;
      arc = {
        x0: cat.x,
        y0: cat.y,
        vx: (g.W / 2 - cat.x) / EXIT_RISE,
        vy0: -grav * EXIT_RISE,
        grav,
      };
      if (Math.abs(arc.vx) > 20) cat.dir = arc.vx > 0 ? 1 : -1;
      cat.vy0 = arc.vy0;
      cat.state = "exit";
      cat.t0 = t;
    };

    const exit = () =>
      new Promise((resolve) => {
        if (cat.state === "gone" || leaving(cat.state)) return resolve();
        if (reduce) {
          cat.state = "gone";
          return resolve();
        }
        exitDone = resolve;
        const t = performance.now() / 1000,
          d = g.W / 2 - cat.x;
        if (Math.abs(d) > 20) cat.dir = d > 0 ? 1 : -1;
        if (cat.state === "leap") startExit(t);
        else {
          cat.state = "exitCrouch";
          cat.t0 = t;
        }
      });

    const purr = () => {
      if (cat.state === "gone") return;
      purrT = performance.now() / 1000;
      slowBlink = true;
      blinkStart = purrT;
      const hx = cat.x / g.cell + cat.dir * 2.5,
        hy = g.groundRow - 22 + cat.y / g.cell;
      words.push({
        x: hx - 1,
        y: hy - 1,
        t0: purrT,
        text: Math.random() < 0.7 ? "prr" : "mrrp",
      });
    };

    let lastT = performance.now() / 1000;
    let raf = 0;
    const frame = (nowMs) => {
      const t = nowMs / 1000,
        dt = Math.min(0.04, t - lastT);
      lastT = t;

      let wiggle = 0,
        dy = 0;
      if (cat.state === "crouch" || cat.state === "exitCrouch") {
        dy = 0.9;
        wiggle = Math.sin((t - cat.t0) * 40) * 0.6;
        if (cat.state === "exitCrouch") {
          if (t - cat.t0 > EXIT_CROUCH) startExit(t);
        } else if (t - cat.t0 > (reduce ? 0.1 : 0.38)) launch(t);
      } else if (cat.state === "leap") {
        if (reduce) {
          cat.x = cat.landX;
          cat.y = cat.landY;
          cat.state = "land";
          cat.t0 = t;
        } else {
          cat.vy += G * dt;
          cat.x += cat.vx * dt;
          cat.y += cat.vy * dt;
          if (cat.y >= cat.landY && cat.vy > 0) {
            cat.y = cat.landY;
            cat.x = cat.landX;
            cat.state = "land";
            cat.t0 = t;
            const row = Math.floor(g.groundRow + cat.y / g.cell);
            for (let k = 0; k < 8; k++)
              dust.push({
                x: cat.x,
                row,
                vx: (Math.random() - 0.5) * 220,
                t0: t,
              });
          }
        }
      } else if (cat.state === "land") {
        dy = 0.9;
        if (t - cat.t0 > 0.2) cat.state = "sit";
      } else if (cat.state === "exit") {
        const s = t - cat.t0;
        cat.vx = arc.vx;
        cat.vy = arc.vy0 + arc.grav * s;
        cat.x = arc.x0 + arc.vx * s;
        cat.y = arc.y0 + arc.vy0 * s + 0.5 * arc.grav * s * s;
        if (cat.vy >= 0 && exitDone) {
          exitDone();
          exitDone = null;
        }
        const margin = 25 * g.cell;
        if (
          (g.groundRow - 16) * g.cell + cat.y > g.H ||
          cat.x < -margin ||
          cat.x > g.W + margin
        )
          cat.state = "gone";
      }

      const idle = !pointer.has || t - pointer.last > 8;
      const headX = cat.x + cat.dir * 3.5 * g.cell,
        headY = (g.groundRow - 12) * g.cell + cat.y;
      let gx = 0,
        gy = 0;
      if (pointer.has) {
        gx = pointer.x - headX;
        gy = pointer.y - headY;
        const dist = Math.hypot(gx, gy) || 1,
          k = Math.min(1, dist / 240);
        gx = (gx / dist) * k * cat.dir;
        gy = (gy / dist) * k;
      }
      look.x += (gx - look.x) * Math.min(1, dt * 10);
      look.y += (gy - look.y) * Math.min(1, dt * 10);
      if (
        cat.state === "sit" &&
        pointer.has &&
        !idle &&
        (pointer.x - cat.x) * cat.dir < -6 * g.cell
      ) {
        if (!cat.flipT) cat.flipT = t;
        if (t - cat.flipT > 0.5) {
          cat.dir *= -1;
          cat.flipT = 0;
        }
      } else cat.flipT = 0;

      if (!reduce && t > nextBlink) {
        blinkStart = t;
        slowBlink = Math.random() < 0.18;
        nextBlink = t + 3 + Math.random() * 4;
      }
      const bd = slowBlink ? 0.9 : 0.16,
        bp = (t - blinkStart) / bd;
      let lid = bp >= 0 && bp < 1 ? Math.sin(bp * Math.PI) : 0;
      if (idle && pointer.has) lid = Math.max(lid, 0.55);
      if (!reduce && t > nextTwitch) {
        twitchT = t;
        nextTwitch = t + 3 + Math.random() * 6;
      }
      const tp = (t - twitchT) / 0.25;

      const airborne = cat.state === "leap" || cat.state === "exit";
      let pitch = 0,
        e = 1;
      if (airborne && cat.vy0) {
        pitch = clamp(
          Math.atan2(cat.vy, Math.abs(cat.vx) + 400) * 0.45,
          -0.32,
          0.38,
        );
        e = Math.min(1, 0.55 + 0.45 * Math.abs(cat.vy / cat.vy0));
      }
      S = {
        t: reduce ? 0 : t,
        look,
        lid,
        pitch,
        e,
        dy,
        wiggle,
        happy: t - purrT < 1.6,
        chill: 0.28,
        pose: cat.state === "sit" ? "sit" : airborne ? "leap" : "crouch",
        twitch: tp >= 0 && tp < 1 ? Math.sin(tp * Math.PI) * 0.9 : 0,
        tailSwish: reduce ? 0 : t - purrT < 2 ? 0.3 : 1,
        tailLift:
          cat.state === "crouch" || cat.state === "exitCrouch" ? 2.5 : 1,
      };

      ctx.clearRect(0, 0, g.W, g.H);
      drawMarks(ctx, g, marks, t);
      if (cat.state !== "gone") drawCat(ctx, g, S, cat);
      drawDust(ctx, g, dust, t);
      drawWords(ctx, g, words, t);

      raf = requestAnimationFrame(frame);
    };

    const setPointer = (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.has = true;
      pointer.last = performance.now() / 1000;
    };
    addEventListener("pointermove", setPointer, { passive: true, signal });
    const poke = (x, y) => {
      const hit =
        cat.state === "sit" &&
        catAt(S, g, cat, Math.floor(x / g.cell), Math.floor(y / g.cell));
      if (hit) purr();
      else jumpTo(x, y);
    };
    const closest = (e, sel) =>
      e.target instanceof Element ? e.target.closest(sel) : null;
    let press = null,
      pendingJump = 0;
    addEventListener(
      "pointerdown",
      (e) => {
        setPointer(e);
        clearTimeout(pendingJump);
        if (closest(e, "a, button, .card, [data-role]")) return;
        if (closest(e, ".tagline, .about, .links, .hint"))
          press = { x: e.clientX, y: e.clientY };
        else poke(e.clientX, e.clientY);
      },
      { signal },
    );
    addEventListener(
      "pointerup",
      (e) => {
        if (!press) return;
        const p = press;
        press = null;
        if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > 4) return;
        pendingJump = setTimeout(() => {
          if (!String(getSelection())) poke(p.x, p.y);
        }, 260);
      },
      { signal },
    );
    addEventListener("pointercancel", () => (press = null), { signal });

    const offPet = onPet(purr);
    const offExit = onExit(exit);
    let rt = 0;
    addEventListener(
      "resize",
      () => {
        clearTimeout(rt);
        rt = setTimeout(fit, 80);
      },
      { signal },
    );

    fontReady(family).then(() => {
      if (signal.aborted) return;
      fit(true);
      ready = true;
      raf = requestAnimationFrame(frame);
      if (atHome) introT = setTimeout(comeHome, reduce ? 0 : 450);
    });

    return () => {
      ac.abort();
      offPet();
      offExit();
      exitDone?.();
      setHome.current = null;
      cancelAnimationFrame(raf);
      clearTimeout(pendingJump);
      clearTimeout(rt);
      clearTimeout(introT);
    };
  }, []);

  useEffect(() => {
    setHome.current?.(pathname === "/");
  }, [pathname]);

  return <canvas ref={ref} aria-hidden="true" />;
}
