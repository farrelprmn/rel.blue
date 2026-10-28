export const hash = (i, j) => {
  const s = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const ell = (x, y, cx, cy, rx, ry) =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;

export function inTri(px, py, ax, ay, bx, by, cx, cy) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

export function segD(px, py, ax, ay, bx, by) {
  const vx = bx - ax,
    vy = by - ay,
    k = clamp(
      ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy || 1),
      0,
      1,
    );
  return Math.hypot(px - ax - vx * k, py - ay - vy * k);
}

export function tailD(px, py, f) {
  let best = 9,
    bs = 0;
  for (let k = 0; k <= 18; k++) {
    const s = k / 18,
      p = f(s),
      d = Math.hypot(px - p[0], py - p[1]);
    if (d < best) {
      best = d;
      bs = s;
    }
  }
  return [best, bs];
}
