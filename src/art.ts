// Original procedural pixel sprites. Drawn at low resolution, then nearest-neighbour scaled.
export const palettes = {
  outline: "#111725",
  light: "#e5d7ad",
  skin: "#dfb58d",
};
export function sprite(
  c: CanvasRenderingContext2D,
  kind: string,
  x: number,
  y: number,
  scale: number,
  color: string,
  t: number,
  dir = 1,
  attack = false,
  rank = 0,
) {
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.scale(scale * dir, scale);
  c.imageSmoothingEnabled = false;
  const r = (x: number, y: number, w: number, h: number, fill = color) => {
    c.fillStyle = fill;
    c.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const poly = (pts: number[], fill: string) => {
    c.fillStyle = fill;
    c.beginPath();
    for (let i = 0; i < pts.length; i += 2)
      i ? c.lineTo(pts[i], pts[i + 1]) : c.moveTo(pts[i], pts[i + 1]);
    c.closePath();
    c.fill();
  };
  const bob = Math.sin(t * 4) * 1,
    step = Math.sin(t * 9) * 2,
    dark = "#17232e",
    shade = "#344858",
    white = "#e6e4c6";
  if (kind.startsWith("hero")) {
    const cl = Number(kind.slice(4));
    poly([-5, -12, -12, 12, 2, 10, 6, -10], rank >= 3 ? "#e6bc7a" : color);
    r(-5, -8, 11, 17, dark);
    r(-4, -6, 9, 11, rank >= 2 ? "#81989f" : shade);
    r(-5, 6, 5, 7 + step, dark);
    r(2, 6, 5, 7 - step, dark);
    r(-6, 12 + step, 7, 3, "#bbb49d");
    r(2, 12 - step, 7, 3, "#bbb49d");
    r(-5, -20 + bob, 11, 11, dark);
    r(-4, -18 + bob, 9, 8, "#d5b48f");
    r(-5, -21 + bob, 11, 4, cl === 3 ? "#c5d2bd" : "#4e4140");
    r(2, -16 + bob, 3, 2, "#19232a");
    r(-6, -10, 12, 4, color);
    if (cl === 1 || cl === 3) {
      poly([-8, -20, 8, -20, 2, -32], color);
      r(-9, -22, 19, 3, dark);
    }
    if (cl === 5) {
      poly([-5, -14, -18, -29, -22, -10, -12, 1], white);
      poly([-12, -10, -23, -18, -21, -4, -10, 2], color);
    }
    if (rank >= 1) {
      r(-7, -8, 5, 5, "#c8c6ac");
      r(5, -8, 5, 5, "#c8c6ac");
    }
    if (rank >= 3) {
      poly([-5, -23, -6, -29, 0, -26, 5, -30, 6, -23], "#efd196");
    }
    c.save();
    c.translate(8, -3);
    if (attack) c.rotate(-0.7);
    if (cl === 0 || cl === 5) {
      r(0, 0, 4, 6, "#c1a174");
      r(-4, -3, 12, 3, "#d2b784");
      poly([0, -3, 0, -25, 2, -31, 5, -25, 4, -3], "#d7e1db");
      r(1, -25, 2, 22, "#95b2b3");
    } else if (cl === 2) {
      r(0, -3, 8, 7, "#f0cc83");
      r(6, -5, 4, 10, color);
    } else {
      r(1, -22, 3, 32, "#ae8e6c");
      poly([-4, -24, 3, -31, 10, -24, 3, -17], color);
      r(1, -26, 4, 5, white);
    }
    c.restore();
  } else if (["slime", "mushroom", "chest", "devourer"].includes(kind)) {
    if (kind === "slime") {
      poly([-13, 8, -11, -2, -6, -10, 5, -12, 12, -5, 15, 9], color);
      r(-12, 8, 27, 4, dark);
      r(-7, -5, 5, 2, "#bfd8c6");
      r(1, -2, 3, 4, dark);
      r(8, -2, 3, 4, dark);
    }
    if (kind === "mushroom") {
      r(-5, -3, 10, 16, "#d8c3a0");
      poly([-17, -4, -11, -15, 7, -18, 18, -5, 15, 1, -16, 1], color);
      r(-8, -11, 5, 4, white);
      r(6, -8, 5, 4, white);
      r(-2, 4, 2, 3, dark);
      r(4, 4, 2, 3, dark);
    }
    if (kind === "chest") {
      r(-16, -10, 32, 24, dark);
      r(-14, -8, 28, 20, "#a88553");
      r(-14, 1, 28, 4, dark);
      r(-11, 0, 5, 6, white);
      r(0, 0, 5, 6, white);
      r(9, 0, 4, 6, white);
      r(-16, -3, 32, 3, "#d6bc72");
      r(-2, -4, 5, 6, "#edd9a1");
      r(-18, 12, 8, 4, color);
      r(10, 12, 8, 4, color);
    }
    if (kind === "devourer") {
      poly([-20, -4, -10, -17, 10, -17, 20, -3, 13, 16, -12, 16], color);
      poly([-13, -5, 13, -5, 8, 10, -8, 10], dark);
      for (let j = -10; j < 12; j += 5)
        poly([j, -5, j + 4, -5, j + 2, 2], white);
    }
  } else if (["wolf", "beast", "serpent", "crawler", "spider"].includes(kind)) {
    if (kind === "serpent") {
      for (let j = 5; j >= 0; j--) {
        r(
          -j * 5,
          Math.sin(t * 5 - j * 0.7) * 6,
          8 - j * 0.5,
          8 - j * 0.5,
          j % 2 ? shade : color,
        );
      }
      poly([0, -5, 17, -8, 23, 0, 12, 8, 0, 8], color);
      r(14, -3, 4, 2, "#f3d997");
    } else if (kind === "spider" || kind === "crawler") {
      for (let j = 0; j < 4; j++) {
        const a = Math.sin(t * 8 + j) * 3;
        poly(
          [
            -5,
            j * 3 - 8,
            -17 - j * 2,
            j * 4 - 14 + a,
            -20 - j * 2,
            j * 4 + 3 + a,
            -17 - j * 2,
            j * 4 - 8 + a,
            -4,
            j * 3 - 5,
          ],
          shade,
        );
        poly(
          [
            5,
            j * 3 - 8,
            17 + j * 2,
            j * 4 - 14 - a,
            20 + j * 2,
            j * 4 + 3 - a,
            17 + j * 2,
            j * 4 - 8 - a,
            4,
            j * 3 - 5,
          ],
          shade,
        );
      }
      r(-9, -11, 18, 22, color);
      r(3, -6, 4, 3, "#f0c185");
      r(-4, -6, 3, 3, "#f0c185");
    } else {
      poly(
        [
          -22, -7, -10, -15, 9, -13, 19, -22, 22, -12, 30, -8, 26, 0, 10, 4,
          -17, 4,
        ],
        color,
      );
      poly([-21, -7, -33, -16, -27, -2, -18, 2], shade);
      r(-16, 2, 5, 11 + step, dark);
      r(9, 2, 5, 11 - step, dark);
      r(18, -11, 4, 3, "#ffe5b0");
      poly([20, -2, 28, -4, 23, 3], white);
      if (kind === "beast") {
        poly([-15, -13, -11, -25, -5, -12], shade);
        poly([0, -14, 5, -28, 9, -12], shade);
      }
    }
  } else if (
    ["bat", "harpy", "angel", "ghost", "elemental", "star"].includes(kind)
  ) {
    const flap = Math.sin(t * 7) * 8;
    if (["bat", "harpy", "angel"].includes(kind)) {
      poly(
        [-4, -4, -17, -19 + flap, -32, -15 + flap, -22, 4, -13, 1, -4, 8],
        color,
      );
      poly([4, -4, 17, -19 + flap, 32, -15 + flap, 22, 4, 13, 1, 4, 8], color);
      r(-6, -10, 12, 22, shade);
      r(-5, -14, 10, 9, kind === "angel" ? "#dedcc4" : color);
      r(0, -11, 4, 2, "#fbe7ae");
      if (kind === "angel") {
        c.strokeStyle = "#e3c990";
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(0, -23, 10, 3, 0, 0, 7);
        c.stroke();
      }
    } else if (kind === "star") {
      poly([0, -28, 7, -9, 27, 0, 8, 9, 0, 28, -8, 9, -27, 0, -7, -9], color);
      poly([0, -12, 12, 0, 0, 12, -12, 0], dark);
      r(-3, -4, 6, 8, white);
    } else {
      poly(
        [
          -9, -14, 8, -14, 14, -3, 13, 17, 6, 11, 0, 18, -6, 11, -13, 17, -13,
          -2,
        ],
        color,
      );
      r(-7, -7, 5, 3, dark);
      r(3, -7, 5, 3, dark);
      if (kind === "elemental")
        poly([-10, -12, -6, -28, 0, -17, 8, -25, 10, -11], "#f1d490");
    }
  } else if (
    ["tree", "golem", "robot", "sentinel", "crystal", "totem"].includes(kind)
  ) {
    if (kind === "crystal" || kind === "totem") {
      poly([0, -27, 13, -9, 8, 17, -9, 17, -14, -9], color);
      poly([0, -27, 0, 17, 8, 17, 13, -9], shade);
      r(-2, -7, 4, 8, white);
      r(-17, 17, 34, 5, dark);
    } else if (kind === "tree") {
      r(-10, -20, 20, 42, "#685d49");
      poly([-9, -10, -22, -25, -27, -14, -15, 4, -8, 5], shade);
      poly([9, -14, 22, -28, 26, -16, 15, 7, 8, 5], shade);
      poly(
        [-23, -23, -17, -40, 1, -48, 20, -36, 26, -19, 10, -13, -11, -15],
        color,
      );
      r(-7, -10, 4, 4, "#f3d57d");
      r(4, -10, 4, 4, "#f3d57d");
      poly([-9, 16, -23, 25, -4, 22, 0, 17, 7, 25, 23, 25, 10, 15], "#685d49");
    } else {
      r(-13, -17, 26, 29, shade);
      r(-10, -15, 20, 22, color);
      r(-7, -27, 16, 13, shade);
      r(-3, -23, 10, 3, "#fbe1a5");
      r(-22, -15, 8, 27, color);
      r(15, -15, 8, 27, color);
      r(-11, 12, 8, 13 + step, shade);
      r(5, 12, 8, 13 - step, shade);
      poly([-6, -6, 0, -12, 7, -6, 0, 1], "#e2d9a5");
      if (kind === "sentinel") {
        poly([-19, -15, -15, -29, -9, -17], white);
        poly([12, -17, 17, -30, 23, -15], white);
      }
      if (kind === "robot") {
        r(15, -5, 22, 8, dark);
        r(28, -7, 9, 12, "#acaa93");
      }
    }
  } else {
    const robe = ["witch", "mage", "reaper", "imp"].includes(kind);
    if (robe) poly([-9, -12, 8, -12, 15, 19, -13, 19], color);
    else {
      r(-9, -10, 18, 22, color);
      r(-8, 10, 6, 11 + step, shade);
      r(3, 10, 6, 11 - step, shade);
    }
    r(-7, -23, 15, 14, kind === "skeleton" ? "#d5d3b4" : color);
    r(-5, -18, 4, 3, dark);
    r(3, -18, 4, 3, dark);
    r(-12, -10, 5, 17, shade);
    r(10, -9, 5, 16, shade);
    if (kind === "goblin") {
      poly([-7, -21, -18, -25, -9, -14], color);
      poly([7, -21, 18, -25, 9, -14], color);
      r(-4, -10, 9, 3, "#e4cd98");
    }
    if (["knight", "champion", "king"].includes(kind)) {
      r(-9, -23, 19, 11, "#606f83");
      r(-6, -17, 13, 3, "#edbe9c");
      r(-12, -11, 7, 8, "#9d9fa6");
      r(9, -11, 7, 8, "#9d9fa6");
    }
    if (kind === "king")
      poly(
        [-9, -23, -10, -34, -4, -29, 0, -37, 5, -29, 11, -34, 9, -23],
        "#d4b587",
      );
    if (kind === "witch") poly([-12, -23, 12, -23, 0, -39], shade);
    if (robe) {
      r(15, -26, 3, 42, "#b5a280");
      poly([10, -28, 17, -36, 24, -28, 17, -20], color);
    } else if (kind === "archer") {
      c.strokeStyle = "#d0b27d";
      c.lineWidth = 3;
      c.beginPath();
      c.arc(9, -2, 17, -1.2, 1.2);
      c.stroke();
      r(12, -17, 1, 30, white);
    } else {
      r(14, -15, 4, 25, "#b3bcbb");
      poly([13, -16, 16, -25, 19, -16], white);
      r(10, 1, 12, 3, "#d0ac7b");
      if (kind === "skeleton") r(-8, -5, 14, 2, white);
    }
  }
  c.restore();
}
export function text(
  c: CanvasRenderingContext2D,
  t: string,
  x: number,
  y: number,
  color = "#e6e7d9",
  size = 11,
) {
  c.font = `${size}px monospace`;
  c.textAlign = "center";
  c.fillStyle = "#0c1724";
  c.fillText(t, x + 1, y + 1);
  c.fillStyle = color;
  c.fillText(t, x, y);
}
export function glow(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "transparent");
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}
export function backdrop(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  cam: number,
  act: number,
  t: number,
) {
  const colors = [
    ["#0d1e31", "#314552", "#a7a47d"],
    ["#101f28", "#29473f", "#8ca576"],
    ["#192b46", "#557c99", "#b2d1ce"],
    ["#1c172c", "#44334e", "#c098ab"],
  ][act];
  const sky = c.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, colors[0]);
  sky.addColorStop(1, colors[1]);
  c.fillStyle = sky;
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) {
    const xx = (((i * 137.7 - cam * 0.06) % (w + 20)) + w + 20) % (w + 20),
      yy = (i * i * 31) % Math.max(1, h * 0.55);
    c.fillStyle = i % 4 ? "#bcd1c34d" : "#e6dfba9a";
    c.fillRect(xx, yy, i % 3 ? 1 : 2, 1);
  }
  const moonX = w * 0.64 - cam * 0.04,
    moonY = h * 0.22;
  glow(c, moonX, moonY, 130, "#c4d8b215");
  c.fillStyle = "#b8c5af";
  c.beginPath();
  c.arc(moonX, moonY, 38, 0, 7);
  c.fill();
  c.fillStyle = colors[0];
  c.beginPath();
  c.arc(moonX + 13, moonY - 9, 35, 0, 7);
  c.fill();
  // Broken celestial islands and a luminous rift.
  c.strokeStyle = "#b8d7e255";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(w * 0.48 - cam * 0.08, 0);
  c.lineTo(w * 0.51 - cam * 0.08, 80);
  c.lineTo(w * 0.47 - cam * 0.08, 125);
  c.lineTo(w * 0.53 - cam * 0.08, 185);
  c.stroke();
  for (let layer = 0; layer < 3; layer++) {
    const par = 0.12 + layer * 0.12,
      base = h * (0.65 + layer * 0.11);
    c.fillStyle = ["#1c303e", "#253a43", "#20333a"][layer];
    if (act === 3) c.fillStyle = ["#2c2339", "#35283e", "#2a2536"][layer];
    if (act === 2) c.fillStyle = ["#405970", "#48687e", "#36546a"][layer];
    c.beginPath();
    c.moveTo(0, h);
    for (let x = -200; x < w + 200; x += 80) {
      const wx = x + cam * par,
        yy =
          base -
          Math.abs(Math.sin(wx * 0.004 + layer) * 130) -
          Math.abs(Math.cos(wx * 0.009)) * 70;
      c.lineTo(x, yy);
    }
    c.lineTo(w, h);
    c.fill();
    for (let i = -2; i < 18; i++) {
      const wx = i * 160,
        xx = wx - ((cam * par) % 160),
        yy = base - 30 + Math.sin(i * 2) * 30;
      if (act === 0 || act === 3) {
        const tall = act === 3 ? 140 : 50;
        c.fillRect(xx, yy - tall, 50, tall + 50);
        c.beginPath();
        c.moveTo(xx - 6, yy - tall);
        c.lineTo(xx + 25, yy - tall - 40);
        c.lineTo(xx + 56, yy - tall);
        c.fill();
        if (layer === 2) {
          c.fillStyle = "#e7bd6c50";
          c.fillRect(xx + 19, yy - tall + 20, 5, 8);
          c.fillStyle = act === 3 ? "#2a2536" : "#20333a";
        }
      } else if (act === 1) {
        c.fillRect(xx + 24, yy - 130, 10, 180);
        c.beginPath();
        c.ellipse(xx + 30, yy - 130, 65, 80, 0, 0, 7);
        c.fill();
      } else {
        c.beginPath();
        c.moveTo(xx - 35, yy - 110);
        c.lineTo(xx + 80, yy - 110);
        c.lineTo(xx + 25, yy - 40);
        c.fill();
        c.fillRect(xx + 15, yy - 160, 9, 50);
        c.fillRect(xx + 55, yy - 160, 9, 50);
      }
    }
  }
  for (let i = 0; i < 25; i++) {
    c.fillStyle = act === 3 ? "#e7a6c857" : "#d8e3bd68";
    c.fillRect(
      (i * 111 + Math.sin(t * 0.4 + i) * 20 - cam * 0.5 + w * 5) % w,
      (i * 57 + t * 8) % h,
      2,
      2,
    );
  }
}
