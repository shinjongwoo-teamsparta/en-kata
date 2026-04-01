import { prepareWithSegments, layoutWithLines } from "@chenglou/pretext";
import type { CharState, GameMode } from "@en-kata/core";
import { ParticleSystem } from "./effects/ParticleSystem";
import { ShakeEffect } from "./effects/ShakeEffect";
import { GlowEffect } from "./effects/GlowEffect";
import { ColorTransition } from "./effects/ColorTransition";

interface ThemeColors {
  bg: string;
  bgSurface: string;
  correct: string;
  incorrect: string;
  textDim: string;
  textBright: string;
  primary: string;
  cursor: string;
  accent: string;
}

interface CharPosition {
  x: number;
  y: number;
  char: string;
  width: number;
}

export interface RendererState {
  text: string;
  currentCharIndex: number;
  charStates: CharState[];
  totalChars: number;
}

const PADDING = 32;
const FONT_SIZE = 20;
const LINE_HEIGHT = 36;
const FONT = `${FONT_SIZE}px "Geist Mono", monospace`;

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private charPositions: CharPosition[] = [];
  private lineCount = 0;
  private animFrameId = 0;
  private lastTime = 0;
  private colors: ThemeColors;
  private state: RendererState = {
    text: "",
    currentCharIndex: 0,
    charStates: [],
    totalChars: 0,
  };

  // Effects
  private particles = new ParticleSystem();
  private shake = new ShakeEffect();
  private glow = new GlowEffect();
  private colorTransition = new ColorTransition();

  // Smooth progress bar
  private displayProgress = 0;

  // Theme observer
  private themeObserver: MutationObserver | null = null;

  private mode: GameMode;
  private effectEnabled: boolean;

  constructor(private canvas: HTMLCanvasElement, mode: GameMode, effect: boolean) {
    this.ctx = canvas.getContext("2d")!;
    this.mode = mode;
    this.effectEnabled = effect;
    this.colors = this.readThemeColors();
    this.setupThemeObserver();
  }

  private readThemeColors(): ThemeColors {
    const style = getComputedStyle(document.documentElement);
    const get = (name: string) => style.getPropertyValue(name).trim();
    return {
      bg: get("--color-bg") || "#1e1e2e",
      bgSurface: get("--color-bg-surface") || "#313244",
      correct: get("--color-correct") || "#a6e3a1",
      incorrect: get("--color-incorrect") || "#f38ba8",
      textDim: get("--color-text-dim") || "#6c7086",
      textBright: get("--color-text-bright") || "#cdd6f4",
      primary: get("--color-primary") || "#89b4fa",
      cursor: get("--color-cursor") || "#f5c2e7",
      accent: get("--color-accent") || "#cba6f7",
    };
  }

  private setupThemeObserver() {
    this.themeObserver = new MutationObserver(() => {
      this.colors = this.readThemeColors();
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });
  }

  resize(width: number, height: number, dpr: number) {
    this.width = width;
    this.height = height;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.state.text) {
      this.layoutText(this.state.text);
    }
  }

  setText(text: string) {
    this.state.text = text;
    this.state.currentCharIndex = 0;
    this.state.charStates = [];
    this.state.totalChars = text.length;
    this.displayProgress = 0;
    this.colorTransition.clear();
    this.layoutText(text);
  }

  private layoutText(text: string) {
    const maxWidth = this.width - PADDING * 2;
    if (maxWidth <= 0) return;

    const prepared = prepareWithSegments(text, FONT);
    const result = layoutWithLines(prepared, maxWidth, LINE_HEIGHT);
    this.lineCount = result.lineCount;
    this.charPositions = [];

    // Font must be set before measureText calls
    this.ctx.font = FONT;

    const shouldCenter = this.mode === "word" || this.mode === "code";

    for (let lineIdx = 0; lineIdx < result.lines.length; lineIdx++) {
      const line = result.lines[lineIdx]!;
      const y = PADDING + lineIdx * LINE_HEIGHT + FONT_SIZE;

      // First pass: measure character widths and total line width
      const charWidths: number[] = [];
      let lineWidth = 0;
      for (let i = 0; i < line.text.length; i++) {
        const w = this.ctx.measureText(line.text[i]!).width;
        charWidths.push(w);
        lineWidth += w;
      }

      // Position characters with alignment
      let x = shouldCenter ? (this.width - lineWidth) / 2 : PADDING;
      for (let i = 0; i < line.text.length; i++) {
        const char = line.text[i]!;
        this.charPositions.push({ x, y, char, width: charWidths[i]! });
        x += charWidths[i]!;
      }
    }

    // Adjust canvas height if needed
    const neededHeight = PADDING * 2 + this.lineCount * LINE_HEIGHT + 20; // +20 for progress bar
    if (neededHeight !== this.height) {
      const dpr = window.devicePixelRatio || 1;
      this.height = neededHeight;
      this.canvas.height = neededHeight * dpr;
      this.canvas.style.height = `${neededHeight}px`;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Re-layout since canvas size changed
      // (positions are already calculated, just need to resize the canvas)
    }
  }

  updateState(currentCharIndex: number, charStates: CharState[]) {
    this.state.currentCharIndex = currentCharIndex;
    this.state.charStates = charStates;
  }

  onCorrectKey() {
    if (!this.effectEnabled) return;
    this.glow.flash();
    const pos = this.charPositions[this.state.currentCharIndex - 1];
    if (pos) {
      this.particles.emit(
        pos.x + pos.width / 2,
        pos.y - FONT_SIZE / 2,
        this.colors.primary,
        6,
      );
    }
  }

  onIncorrectKey() {
    if (!this.effectEnabled) return;
    this.shake.trigger(3);
    const pos = this.charPositions[this.state.currentCharIndex - 1];
    if (pos) {
      this.particles.emit(
        pos.x + pos.width / 2,
        pos.y - FONT_SIZE / 2,
        this.colors.incorrect,
        3,
      );
    }
  }

  onWordComplete(perfect: boolean) {
    if (!this.effectEnabled) return;
    this.glow.screenFlash(this.colors.primary);

    if (!perfect) return;

    // Burst from progress bar's current fill endpoint (only on perfect words)
    const barY = this.height - 3 - 8;
    const barWidth = this.width - PADDING * 2;
    const cx = PADDING + barWidth * this.displayProgress;
    const cy = barY;
    this.particles.emit(cx, cy, this.colors.primary, 18, true);
    this.particles.emit(cx, cy, this.colors.accent, 10, true);
  }

  start() {
    this.lastTime = performance.now();
    this.loop();
  }

  stop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
    this.themeObserver?.disconnect();
  }

  private loop = () => {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05); // cap at 50ms
    this.lastTime = now;

    this.update(dt);
    this.draw();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.particles.update(dt);
    this.shake.update(dt);
    this.glow.update(dt);
    this.colorTransition.update(dt);

    // Smooth progress bar interpolation (ease-out)
    const targetProgress = this.state.totalChars > 0
      ? this.state.currentCharIndex / this.state.totalChars
      : 0;
    const speed = 8; // higher = snappier
    this.displayProgress += (targetProgress - this.displayProgress) * (1 - Math.exp(-speed * dt));

    // Update color targets
    for (let i = 0; i < this.charPositions.length; i++) {
      let targetColor: string;
      if (i < this.state.currentCharIndex) {
        targetColor =
          this.state.charStates[i] === "correct"
            ? this.colors.correct
            : this.colors.incorrect;
      } else if (i === this.state.currentCharIndex) {
        targetColor = this.colors.textBright;
      } else {
        targetColor = this.colors.textDim;
      }
      this.colorTransition.setTarget(i, targetColor);
    }
  }

  private draw() {
    const { ctx } = this;

    // Clear
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();

    // Apply shake
    if (this.effectEnabled) {
      this.shake.apply(ctx);
    }

    // Set font
    ctx.font = FONT;
    ctx.textBaseline = "alphabetic";

    // Draw cursor glow — use primary for cohesion with correct-key particles
    const cursorPos = this.charPositions[this.state.currentCharIndex];
    if (this.effectEnabled && cursorPos) {
      this.glow.draw(
        ctx,
        cursorPos.x + cursorPos.width / 2,
        cursorPos.y - FONT_SIZE / 3,
        this.colors.primary,
        28,
      );
    }

    // Draw characters
    for (let i = 0; i < this.charPositions.length; i++) {
      const pos = this.charPositions[i]!;
      const color = this.colorTransition.getColor(i, this.colors.textDim);
      ctx.fillStyle = color;
      ctx.fillText(pos.char, pos.x, pos.y);
    }

    // Draw cursor underline
    if (cursorPos) {
      ctx.fillStyle = this.colors.cursor;
      const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 500 * Math.PI);
      ctx.globalAlpha = pulse;
      ctx.fillRect(cursorPos.x, cursorPos.y + 3, cursorPos.width, 2);
      ctx.globalAlpha = 1;
    }

    // Draw particles
    if (this.effectEnabled) {
      this.particles.draw(ctx);
    }

    ctx.restore();

    // Word-complete screen flash (drawn outside shake so it covers everything)
    if (this.effectEnabled) {
      this.glow.drawScreenFlash(ctx, this.width, this.height);
    }

    // Draw progress bar (outside shake)
    this.drawProgressBar();
  }

  private drawProgressBar() {
    const { ctx } = this;
    const barHeight = 3;
    const barY = this.height - barHeight - 8;
    const barWidth = this.width - PADDING * 2;

    // Background
    ctx.fillStyle = this.colors.bgSurface;
    ctx.fillRect(PADDING, barY, barWidth, barHeight);

    // Fill (smoothly interpolated)
    if (this.displayProgress > 0.001) {
      ctx.fillStyle = this.colors.primary;
      ctx.fillRect(PADDING, barY, barWidth * this.displayProgress, barHeight);
    }
  }

  getRequiredHeight(): number {
    return PADDING * 2 + this.lineCount * LINE_HEIGHT + 20;
  }
}
