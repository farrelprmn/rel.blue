import { ell, hash } from "./geometry";
import { P } from "./palette";

export const canvasFont = (cv) => getComputedStyle(cv).fontFamily;

export const fontReady = (family) =>
  document.fonts?.load
    ? document.fonts.load(`12px ${family}`).catch(() => {})
    : Promise.resolve();

export function fitCanvas(cv, ctx, family) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = innerWidth,
    H = innerHeight,
    mobile = W < 900,
    cell = W < 520 ? 9 : mobile ? 10 : 12,
    cols = Math.ceil(W / cell),
    rows = Math.ceil(H / cell);
  cv.width = W * dpr;
  cv.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.font = `${Math.round(cell * 0.78)}px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  return { W, H, cell, cols, rows, groundRow: rows - (mobile ? 4 : 5), mobile };
}

export function cellRect(ctx, g, i, j, pal, ch) {
  const x = i * g.cell,
    y = j * g.cell;
  if (pal[0]) {
    ctx.fillStyle = pal[0];
    ctx.fillRect(x + 0.5, y + 0.5, g.cell - 1, g.cell - 1);
  }
  ctx.fillStyle = pal[1];
  ctx.fillText(ch, x + g.cell / 2, y + g.cell / 2 + 1);
}

export function makeStars(g) {
  const stars = [];
  const n = Math.round(g.cols * g.groundRow * 0.008);
  for (let k = 0; k < n; k++) {
    const r = Math.random();
    stars.push({
      i: Math.floor(Math.random() * g.cols),
      j: Math.floor(Math.random() * (g.groundRow - 2)),
      ch: r < 0.7 ? "." : r < 0.93 ? "+" : "*",
      ph: Math.random() * 6.28,
      sp: 0.6 + Math.random() * 1.8,
    });
  }
  return stars;
}

export function drawScene(ctx, g, stars, t, reduce) {
  const { cell, cols, rows, groundRow, mobile } = g;
  ctx.fillStyle = "#a49e94";
  for (const st of stars) {
    ctx.globalAlpha = reduce
      ? 0.3
      : 0.1 + 0.34 * (0.5 + 0.5 * Math.sin(t * st.sp + st.ph));
    ctx.fillText(st.ch, st.i * cell + cell / 2, st.j * cell + cell / 2);
  }
  ctx.globalAlpha = 1;
  const upright = mobile && g.H > g.W,
    short = g.H < 560 && g.W > g.H;
  const mx = upright ? 8 : short ? cols - 7 : cols - 16,
    my = upright ? groundRow - 14 : short ? 6 : 9,
    mr = mobile ? 3.6 : 4.8;
  for (let j = Math.floor(my - mr); j <= my + mr; j++)
    for (let i = Math.floor(mx - mr); i <= mx + mr; i++) {
      if (ell(i + 0.5, j + 0.5, mx, my, mr, mr) < 1) {
        const cr =
          ell(i + 0.5, j + 0.5, mx - 1.4, my - 1, 1.2, 1.2) < 1 ||
          ell(i + 0.5, j + 0.5, mx + 1.6, my + 1.5, 0.9, 0.9) < 1;
        cellRect(ctx, g, i, j, cr ? P.crater : P.moon, cr ? "o" : ".");
      }
    }
  for (let i = 0; i < cols; i++) cellRect(ctx, g, i, groundRow, P.ridge, "_");
  for (let j = groundRow + 1; j < rows; j++) {
    const off = (j - groundRow) % 2;
    for (let i = 0; i < cols; i++) {
      const k = (i + off) % 2;
      cellRect(
        ctx,
        g,
        i,
        j,
        hash(i, j) > 0.85 ? P.tile2 : P.tile,
        k ? ")" : "(",
      );
    }
  }
}
