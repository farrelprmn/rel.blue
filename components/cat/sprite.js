import { clamp, ell, hash, inTri, lerp, segD, tailD } from "./geometry";
import { P } from "./palette";
import { cellRect } from "./scene";

function eyeCell(f, dx, dy, outer, lidAmt, happy) {
  const o = dx * outer;
  const inside =
    (dy === 0 && Math.abs(dx) <= 2) ||
    (Math.abs(dy) === 1 && Math.abs(dx) <= 1);
  const rim = (dy === -2 && o >= -1 && o <= 2) || (dy === -1 && o === 2);
  if (happy) {
    if ((dy === -1 && Math.abs(dx) <= 1) || (dy === 0 && Math.abs(dx) === 2))
      return [P.arc, "^"];
    return inside || rim || (dy === -1 && o === -2) ? [P.fur, "^"] : null;
  }
  if (rim) return null;
  if (!inside) return null;
  const covered = Math.min(2, Math.ceil(lidAmt * 3 - 1e-6));
  if (dy + 1 < covered) return [P.lid, "-"];
  const first = -1 + Math.max(0, covered);
  const pdx = clamp(Math.round(f.look.x * 1.3), -1, 1);
  if (dx === pdx) return [P.pupil, "|"];
  if (dy === first && dx === pdx + (pdx < 1 ? 1 : -1)) return [P.glint, "·"];
  return dy <= first ? [P.iris2, ":"] : [P.eye, "."];
}

function sitCell(f, x, y) {
  for (const [ex, outer] of [
    [-0.5, -1],
    [5.5, 1],
  ]) {
    const r = eyeCell(
      f,
      Math.round(x - ex),
      Math.round(y + 12.5),
      outer,
      Math.max(f.lid, f.chill),
      f.happy,
    );
    if (r) return r;
  }
  if (Math.abs(x - 2.5) < 0.6 && Math.abs(y + 10.5) < 0.55)
    return [P.nose, "v"];
  if (y > -9.9 && y < -8.9 && Math.abs(x - 2.5) < 1.2) return [P.cream, "w"];
  if (ell(x, y, 2.5, -9.6, 2.6, 1.5) < 1) return [P.cream, '"'];
  const tw = f.twitch;
  const notch = ell(x, y, 8.6, -19.2, 1.1, 1.0) < 1;
  if (inTri(x, y, -3.2, -15.6, 0.0, -17.3, -2.6, -19.6)) return [P.earIn, "^"];
  if (inTri(x, y, -4.6, -14.2, 1.6, -17.6, -3.2, -21.2)) return [P.fur, "/"];
  if (!notch && inTri(x, y, 8.2, -15.6, 5.0, -17.3, 7.6 + tw, -19.6))
    return [P.earIn, "^"];
  if (!notch && inTri(x, y, 9.6, -14.2, 3.4, -17.6, 8.2 + tw * 1.4, -21.2))
    return [P.fur, "\\"];
  if (ell(x, y, 2.5, -12.4, 6.9, 5.3) < 1) {
    if (y < -15.6 && Math.abs(x - 2.5) < 2 && Math.floor(x + 60) % 2 === 0)
      return [P.stripe, "|"];
    if (Math.abs(x - 2.5) > 5.4 && y > -12.4) return [P.fur2, '"'];
    return [
      hash(Math.floor(x + 99), Math.floor(y + 99)) > 0.82 ? P.fur2 : P.fur,
      "^",
    ];
  }
  if (
    (Math.abs(y + 10.2) < 0.5 || Math.abs(y + 9.2) < 0.5) &&
    ((x > -6.8 && x < -4.6) || (x > 9.6 && x < 11.8))
  )
    return [P.whisker, "-"];
  for (const px of [0.9, 4.1])
    if (ell(x, y, px, -0.55, 1.3, 0.75) < 1) return [P.cream, "m"];
  if (ell(x, y, 2.5, -4.2, 2.5, 2.7) < 1) return [P.cream, '"'];
  if (ell(x, y, -2.8, -0.55, 1.5, 0.72) < 1) return [P.cream, "m"];
  if (
    ell(x, y, -1.8, -2.4, 3.0, 2.4) < 1 ||
    ell(x, y, 1.5, -3.6, 4.8, 3.9) < 1
  ) {
    if ((((x * 0.7 - y * 0.25) % 2.2) + 2.2) % 2.2 < 0.7)
      return [P.stripe, ")"];
    return [P.fur, "~"];
  }
  const [d, s] = tailD(x, y, (s) => [
    -4.4 - 4.4 * s + Math.sin(f.t * 2.1 + s * 2.4) * 1.2 * s * f.tailSwish,
    -1.0 - 7 * s * s * (0.8 + 0.2 * Math.sin(f.t * 1.7)),
  ]);
  if (d < 1.4 - s * 0.35)
    return Math.floor(s * 6) % 2 ? [P.stripe, "s"] : [P.fur, "s"];
  return null;
}

function leapCell(f, x0, y0) {
  const p = f.pitch,
    yl = y0 - f.dy;
  const hcx = 7 * Math.cos(p) + 2.4 * Math.sin(p),
    hcy = 7 * Math.sin(p) - 2.4 * Math.cos(p) - 5;
  const hx = x0 - (hcx - 7),
    hy = yl - (hcy + 7.4);
  for (const [ex, outer] of [
    [4.4, -1],
    [9.6, 1],
  ]) {
    const r = eyeCell(
      f,
      Math.round(hx - ex),
      Math.round(hy + 7.5),
      outer,
      0,
      false,
    );
    if (r) return r;
  }
  if (ell(hx, hy, 7.1, -4.7, 0.75, 0.65) < 1) return [P.nose, "o"];
  if (ell(hx, hy, 7.0, -5.3, 2.3, 1.35) < 1) return [P.cream, '"'];
  if (inTri(hx, hy, 3.9, -10.8, 5.6, -11.6, 4.0, -13.2)) return [P.earIn, "^"];
  if (inTri(hx, hy, 2.4, -9.6, 6.6, -11.9, 3.0, -14.6)) return [P.fur, "/"];
  if (inTri(hx, hy, 8.5, -11.6, 10.2, -10.8, 10.1, -13.2))
    return [P.earIn, "^"];
  if (inTri(hx, hy, 7.4, -11.9, 11.6, -9.6, 11.0, -14.6)) return [P.fur, "\\"];
  if (ell(hx, hy, 7, -7.4, 5.3, 4.3) < 1) return [P.fur, "^"];
  if (
    hx > 12.4 &&
    hx < 14.4 &&
    (Math.abs(hy + 6.2) < 0.5 || Math.abs(hy + 5.2) < 0.5)
  )
    return [P.whisker, "-"];
  let x = x0 + (x0 < -2 ? f.wiggle : 0),
    y = yl;
  const c = Math.cos(-p),
    sn = Math.sin(-p),
    rx = x,
    ry = y + 5;
  x = rx * c - ry * sn;
  y = rx * sn + ry * c - 5;
  const e = f.e;
  const legs =
    f.pose === "leap"
      ? [
          [3.0, -3.4, lerp(4.4, 8.2, e), lerp(-1.4, -2.2, e)],
          [-5.0, -3.6, lerp(-5.6, -9.8, e), lerp(-1.4, -2.6, e)],
        ]
      : [
          [3.0, -3.2, 4.6, -1.0],
          [-4.8, -3.2, -5.4, -1.0],
        ];
  for (const L of legs) {
    if (Math.hypot(x - L[2], y - L[3]) < 0.95) return [P.cream, "m"];
    if (segD(x, y, L[0], L[1], L[2], L[3]) < 0.85)
      return [P.fur, L[2] > 0 ? "/" : "\\"];
  }
  if (ell(x, y, -1, -4.6, 6.4, 2.9) < 1) {
    if (y > -3.3) return [P.cream, '"'];
    if ((x + 100) % 2.4 < 0.8) return [P.stripe, "|"];
    return [P.fur, "~"];
  }
  for (const L of legs) {
    if (segD(x, y, L[0] + 0.9, L[1], L[2] + 0.9, L[3] - 0.3) < 0.75)
      return [P.farLeg, L[2] > 0 ? "/" : "\\"];
  }
  const [d, s] = tailD(x, y, (s) => [
    -7 - 6.2 * s,
    -5.2 - 1.8 * s * f.tailLift + Math.sin(f.t * 9 + s * 4) * 0.6 * s,
  ]);
  if (d < 1.2 - s * 0.3)
    return Math.floor(s * 6) % 2 ? [P.stripe, "s"] : [P.fur, "s"];
  return null;
}

export function catAt(f, g, cat, i, j) {
  const sit = f.pose === "sit";
  const cx = sit ? Math.round(cat.x / g.cell) : cat.x / g.cell,
    cy = sit ? Math.round(cat.y / g.cell) : cat.y / g.cell;
  const lx = (i + 0.5 - cx) * cat.dir,
    ly = j + 0.5 - g.groundRow - cy;
  return sit ? sitCell(f, lx, ly) : leapCell(f, lx, ly);
}

export function drawCat(ctx, g, f, cat) {
  const ci = Math.floor(cat.x / g.cell),
    cj = Math.floor(g.groundRow + cat.y / g.cell);
  const i0 = ci - 22,
    j0 = cj - 24,
    bw = 45,
    bh = 26,
    buf = new Array(bw * bh);
  for (let j = 0; j < bh; j++)
    for (let i = 0; i < bw; i++)
      buf[j * bw + i] = catAt(f, g, cat, i0 + i, j0 + j);
  const solid = (i, j) =>
    i >= 0 && j >= 0 && i < bw && j < bh && !!buf[j * bw + i];
  for (let j = 0; j < bh; j++)
    for (let i = 0; i < bw; i++) {
      const r = buf[j * bw + i];
      if (r) {
        cellRect(ctx, g, i0 + i, j0 + j, r[0], r[1]);
        continue;
      }
      if (j0 + j + 0.5 - g.groundRow - cat.y / g.cell > 0) continue;
      if (
        solid(i - 1, j) ||
        solid(i + 1, j) ||
        solid(i, j - 1) ||
        solid(i, j + 1)
      )
        cellRect(ctx, g, i0 + i, j0 + j, P.outline, "");
    }
}
