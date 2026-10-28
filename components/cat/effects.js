export function drawMarks(ctx, g, marks, t) {
  const { cell } = g;
  for (let k = marks.length - 1; k >= 0; k--) {
    const m = marks[k],
      age = t - m.t0;
    if (age > 0.7) {
      marks.splice(k, 1);
      continue;
    }
    const i = Math.floor(m.x / cell),
      j = Math.floor(m.y / cell),
      r = Math.round(age * 4);
    ctx.globalAlpha = 1 - age / 0.7;
    ctx.fillStyle = "#e98a3c";
    ctx.fillText("+", i * cell + cell / 2, j * cell + cell / 2);
    if (r)
      for (const [a, b] of [
        [-r, 0],
        [r, 0],
        [0, -r],
        [0, r],
      ])
        ctx.fillText("·", (i + a) * cell + cell / 2, (j + b) * cell + cell / 2);
    ctx.globalAlpha = 1;
  }
}

export function drawDust(ctx, g, dust, t) {
  const { cell } = g;
  for (let k = dust.length - 1; k >= 0; k--) {
    const p = dust[k],
      age = t - p.t0;
    if (age > 0.5) {
      dust.splice(k, 1);
      continue;
    }
    ctx.globalAlpha = 1 - age / 0.5;
    ctx.fillStyle = "#9b8f83";
    const i = Math.floor((p.x + p.vx * age) / cell),
      j = p.row - 1 - (age < 0.2 ? 0 : 1);
    ctx.fillText(
      age < 0.25 ? "." : ",",
      i * cell + cell / 2,
      j * cell + cell / 2,
    );
    ctx.globalAlpha = 1;
  }
}

export function drawWords(ctx, g, words, t) {
  const { cell } = g;
  for (let p = words.length - 1; p >= 0; p--) {
    const q = words[p],
      age = t - q.t0;
    if (age > 1.8) {
      words.splice(p, 1);
      continue;
    }
    if (age < 0) continue;
    ctx.globalAlpha = 1 - age / 1.8;
    ctx.fillStyle = q.color || "#e98a3c";
    const j = Math.round(q.y - age * 4);
    for (let c = 0; c < q.text.length; c++)
      ctx.fillText(
        q.text[c],
        (Math.round(q.x) + c) * cell + cell / 2,
        j * cell + cell / 2,
      );
    ctx.globalAlpha = 1;
  }
}
