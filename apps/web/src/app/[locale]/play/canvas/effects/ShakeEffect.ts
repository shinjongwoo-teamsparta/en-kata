const MAX_AMPLITUDE = 8;
const DECAY_RATE = 12; // per second

export class ShakeEffect {
  private amplitude = 0;
  private time = 0;

  trigger(strength = 3) {
    this.amplitude = Math.min(this.amplitude + strength, MAX_AMPLITUDE);
    this.time = 0;
  }

  update(dt: number) {
    if (this.amplitude <= 0.1) {
      this.amplitude = 0;
      return;
    }
    this.time += dt;
    this.amplitude *= Math.exp(-DECAY_RATE * dt);
  }

  apply(ctx: CanvasRenderingContext2D) {
    if (this.amplitude < 0.1) return;
    const x = this.amplitude * Math.sin(this.time * 30 * Math.PI * 2);
    const y = this.amplitude * Math.cos(this.time * 25 * Math.PI * 2) * 0.5;
    ctx.translate(x, y);
  }

  get isActive() {
    return this.amplitude >= 0.1;
  }
}
