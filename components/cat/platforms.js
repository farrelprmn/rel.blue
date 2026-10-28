const SURFACES = ".tagline, .about p, .links, .hint";

export function findPlatforms(g) {
  if (g.W < 600) return [];
  const plats = [];
  document.querySelectorAll(SURFACES).forEach((el) => {
    const r = document.createRange();
    r.selectNodeContents(el);
    for (const b of r.getClientRects()) {
      if (b.width < 4) continue;
      const p = plats.find(
        (q) =>
          Math.abs(q.top - b.top) < 4 &&
          b.left <= q.x2 + 30 &&
          b.right >= q.x1 - 30,
      );
      if (p) {
        p.x1 = Math.min(p.x1, b.left);
        p.x2 = Math.max(p.x2, b.right);
        p.bottom = Math.max(p.bottom, b.bottom);
      } else
        plats.push({ x1: b.left, x2: b.right, top: b.top, bottom: b.bottom });
    }
  });
  return plats.filter((p) => p.top > 23 * g.cell);
}

export function textRight() {
  let right = 0;
  document.querySelectorAll(SURFACES).forEach((el) => {
    const r = document.createRange();
    r.selectNodeContents(el);
    for (const b of r.getClientRects()) right = Math.max(right, b.right);
  });
  return right;
}

export function pickPlat(plats, tx, ty) {
  let best = null,
    bd = 1e9;
  for (const p of plats) {
    if (
      tx < p.x1 - 12 ||
      tx > p.x2 + 12 ||
      ty < p.top - 80 ||
      ty > p.bottom + 6
    )
      continue;
    const d = Math.abs(ty - p.top);
    if (d < bd) {
      bd = d;
      best = p;
    }
  }
  return best;
}
