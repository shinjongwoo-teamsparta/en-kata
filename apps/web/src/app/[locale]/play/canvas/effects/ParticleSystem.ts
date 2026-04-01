interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  r: number;
  g: number;
  b: number;
  glow: boolean; // soft glow particle vs sparkle
}

const POOL_SIZE = 300;
const GRAVITY = 60;

function parseRGB(color: string): [number, number, number] {
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

// Slight hue variation for visual richness
function varyColor(
  r: number,
  g: number,
  b: number,
  amount: number,
): [number, number, number] {
  const dr = (Math.random() - 0.5) * amount * 2;
  const dg = (Math.random() - 0.5) * amount * 2;
  const db = (Math.random() - 0.5) * amount * 2;
  return [
    Math.max(0, Math.min(255, Math.round(r + dr))),
    Math.max(0, Math.min(255, Math.round(g + dg))),
    Math.max(0, Math.min(255, Math.round(b + db))),
  ];
}

export class ParticleSystem {
  private pool: Particle[] = [];
  private activeCount = 0;

  constructor() {
    for (let i = 0; i < POOL_SIZE; i++) {
      this.pool.push({
        x: 0, y: 0, vx: 0, vy: 0,
        life: 0, maxLife: 0, size: 0,
        r: 0, g: 0, b: 0, glow: false,
      });
    }
  }

  emit(x: number, y: number, color: string, count: number, burst = false) {
    const [cr, cg, cb] = parseRGB(color);

    for (let i = 0; i < count; i++) {
      if (this.activeCount >= POOL_SIZE) break;
      const p = this.pool[this.activeCount]!;
      p.x = x + (Math.random() - 0.5) * 4;
      p.y = y + (Math.random() - 0.5) * 4;

      // Color variation
      const [vr, vg, vb] = varyColor(cr, cg, cb, 25);
      p.r = vr;
      p.g = vg;
      p.b = vb;

      if (burst) {
        // Word complete: upward fan burst (π to 2π range = upward semicircle)
        const angle = Math.PI + (Math.PI * i) / count + (Math.random() - 0.5) * 0.3;
        const speed = 80 + Math.random() * 120;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.life = 0.6 + Math.random() * 0.5;
        p.maxLife = p.life;
        p.glow = i % 3 !== 0; // 2/3 are soft glows
        p.size = p.glow ? 3 + Math.random() * 3 : 1.5 + Math.random() * 1.5;
      } else {
        // Keystroke: upward drift with sparkle mix
        p.vx = (Math.random() - 0.5) * 35;
        p.vy = -(25 + Math.random() * 45);
        p.life = 0.35 + Math.random() * 0.35;
        p.maxLife = p.life;
        p.glow = Math.random() > 0.4;
        p.size = p.glow ? 2.5 + Math.random() * 2 : 1 + Math.random() * 1.5;
      }
      this.activeCount++;
    }
  }

  update(dt: number) {
    let i = 0;
    while (i < this.activeCount) {
      const p = this.pool[i]!;
      p.life -= dt;
      if (p.life <= 0) {
        this.activeCount--;
        const last = this.pool[this.activeCount]!;
        this.pool[i] = last;
        this.pool[this.activeCount] = p;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += GRAVITY * dt;
      // Gentle drag for floatier feel
      p.vx *= 1 - 1.5 * dt;
      p.vy *= 1 - 0.8 * dt;
      i++;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();

    for (let i = 0; i < this.activeCount; i++) {
      const p = this.pool[i]!;
      // Ease-out curve: particles fade out smoothly at end of life
      const t = p.life / p.maxLife;
      const alpha = t * t; // quadratic ease-out
      const size = p.size * (0.4 + 0.6 * t); // shrink gently

      if (p.glow) {
        // Soft glow particle: radial gradient for a bloom-like effect
        const glowRadius = size * 3;
        ctx.globalCompositeOperation = "lighter";
        const grad = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, glowRadius,
        );
        grad.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${alpha * 0.6})`);
        grad.addColorStop(0.4, `rgba(${p.r},${p.g},${p.b},${alpha * 0.2})`);
        grad.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(
          p.x - glowRadius, p.y - glowRadius,
          glowRadius * 2, glowRadius * 2,
        );
      } else {
        // Sparkle: bright hard point with soft edge
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = alpha;

        // Soft outer
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},0.15)`;
        ctx.fill();

        // Bright core — shifted toward white
        const br = Math.min(255, p.r + 80);
        const bg = Math.min(255, p.g + 80);
        const bb = Math.min(255, p.b + 80);
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${br},${bg},${bb},${Math.min(1, alpha * 1.2)})`;
        ctx.fill();

        ctx.globalAlpha = 1;
      }
    }

    ctx.restore();
  }

  get active() {
    return this.activeCount;
  }
}
