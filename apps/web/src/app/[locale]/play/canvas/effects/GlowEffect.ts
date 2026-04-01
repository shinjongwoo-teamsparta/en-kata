export class GlowEffect {
  private time = 0;
  private flashIntensity = 0;
  private flashRadius = 0;

  // Full-screen flash for word complete
  private screenFlashAlpha = 0;
  private screenFlashColor: [number, number, number] = [0, 0, 0];

  flash() {
    this.flashIntensity = 1;
    this.flashRadius = 1;
  }

  screenFlash(color: string) {
    this.screenFlashAlpha = 0.25;
    this.screenFlashColor = this.parseRGB(color);
  }

  update(dt: number) {
    this.time += dt;
    if (this.flashIntensity > 0) {
      this.flashIntensity *= Math.exp(-6 * dt);
      if (this.flashIntensity < 0.01) this.flashIntensity = 0;
    }
    if (this.flashRadius > 0) {
      this.flashRadius *= Math.exp(-4 * dt);
      if (this.flashRadius < 0.01) this.flashRadius = 0;
    }
    if (this.screenFlashAlpha > 0) {
      this.screenFlashAlpha *= Math.exp(-5 * dt);
      if (this.screenFlashAlpha < 0.005) this.screenFlashAlpha = 0;
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    radius = 20,
  ) {
    const [r, g, b] = this.parseRGB(color);

    // Organic multi-frequency breathing
    const breathe =
      0.18 +
      0.08 * Math.sin(this.time * 1.8) +
      0.05 * Math.sin(this.time * 3.1 + 0.7) +
      0.03 * Math.sin(this.time * 5.3 + 1.4);

    // Flash expands radius and boosts brightness
    const expandedRadius = radius + this.flashRadius * radius * 0.6;
    const flashBoost = this.flashIntensity * 0.45;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    // Outer halo — large, very soft, gives depth
    const outerR = expandedRadius * 1.8;
    const outerAlpha = (breathe * 0.35 + flashBoost * 0.3) * 0.6;
    const outerGrad = ctx.createRadialGradient(x, y, 0, x, y, outerR);
    outerGrad.addColorStop(0, `rgba(${r},${g},${b},${outerAlpha * 0.5})`);
    outerGrad.addColorStop(0.4, `rgba(${r},${g},${b},${outerAlpha * 0.25})`);
    outerGrad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = outerGrad;
    ctx.fillRect(x - outerR, y - outerR, outerR * 2, outerR * 2);

    // Inner core — bright, tight, warm-shifted
    const coreR = expandedRadius * 0.7;
    const coreAlpha = breathe + flashBoost;
    const cr = Math.min(255, r + 40);
    const cg = Math.min(255, g + 40);
    const cb = Math.min(255, b + 40);
    const coreGrad = ctx.createRadialGradient(x, y, 0, x, y, coreR);
    coreGrad.addColorStop(
      0,
      `rgba(${cr},${cg},${cb},${Math.min(1, coreAlpha * 0.7)})`,
    );
    coreGrad.addColorStop(
      0.5,
      `rgba(${r},${g},${b},${coreAlpha * 0.3})`,
    );
    coreGrad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = coreGrad;
    ctx.fillRect(x - coreR, y - coreR, coreR * 2, coreR * 2);

    ctx.restore();
  }

  drawScreenFlash(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (this.screenFlashAlpha <= 0) return;

    const [r, g, b] = this.screenFlashColor;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    // Horizontal gradient band across center — feels like a sweep
    const cy = height * 0.45;
    const bandH = height * 0.7;
    const grad = ctx.createRadialGradient(
      width / 2, cy, 0,
      width / 2, cy, width * 0.6,
    );
    grad.addColorStop(0, `rgba(${r},${g},${b},${this.screenFlashAlpha})`);
    grad.addColorStop(0.5, `rgba(${r},${g},${b},${this.screenFlashAlpha * 0.4})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, cy - bandH / 2, width, bandH);

    ctx.restore();
  }

  parseRGB(color: string): [number, number, number] {
    if (color.startsWith("#")) {
      return [
        parseInt(color.slice(1, 3), 16),
        parseInt(color.slice(3, 5), 16),
        parseInt(color.slice(5, 7), 16),
      ];
    }
    const match = color.match(/[\d.]+/g);
    if (match && match.length >= 3) {
      return [+match[0]!, +match[1]!, +match[2]!];
    }
    return [200, 200, 200];
  }
}
