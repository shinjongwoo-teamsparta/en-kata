interface RGB {
  r: number;
  g: number;
  b: number;
}

function parseColor(color: string): RGB {
  if (color.startsWith("#")) {
    return {
      r: parseInt(color.slice(1, 3), 16),
      g: parseInt(color.slice(3, 5), 16),
      b: parseInt(color.slice(5, 7), 16),
    };
  }
  const match = color.match(/[\d.]+/g);
  if (match && match.length >= 3) {
    return { r: +match[0]!, g: +match[1]!, b: +match[2]! };
  }
  return { r: 128, g: 128, b: 128 };
}

function lerpRGB(a: RGB, b: RGB, t: number): RGB {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

function rgbToString(c: RGB): string {
  return `rgb(${c.r},${c.g},${c.b})`;
}

const LERP_SPEED = 12; // per second

export class ColorTransition {
  private current: Map<number, RGB> = new Map();
  private target: Map<number, RGB> = new Map();

  setTarget(index: number, color: string) {
    const rgb = parseColor(color);
    this.target.set(index, rgb);
    if (!this.current.has(index)) {
      this.current.set(index, { ...rgb });
    }
  }

  update(dt: number) {
    const t = Math.min(1, LERP_SPEED * dt);
    for (const [index, targetRGB] of this.target) {
      const currentRGB = this.current.get(index);
      if (!currentRGB) {
        this.current.set(index, { ...targetRGB });
        continue;
      }
      this.current.set(index, lerpRGB(currentRGB, targetRGB, t));
    }
  }

  getColor(index: number, fallback: string): string {
    const c = this.current.get(index);
    return c ? rgbToString(c) : fallback;
  }

  clear() {
    this.current.clear();
    this.target.clear();
  }
}
