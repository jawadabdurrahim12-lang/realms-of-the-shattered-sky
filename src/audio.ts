export class Audio {
  ctx: AudioContext | null = null;
  enabled = false;
  step = 0;
  timer: any;
  act = 0;
  boss = false;
  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.ctx ??= new AudioContext();
      this.ctx.resume();
      if (!this.timer) this.timer = setInterval(() => this.music(), 340);
    }
    return this.enabled;
  }
  tone(
    freq: number,
    duration = 0.16,
    type: OscillatorType = "sine",
    volume = 0.035,
    delay = 0,
  ) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime + delay,
      o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(volume, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(g).connect(this.ctx.destination);
    o.start(t);
    o.stop(t + duration + 0.01);
  }
  music() {
    if (!this.enabled) return;
    const scales = [
        [0, 3, 7, 10, 12, 7, 3, 5],
        [0, 2, 5, 7, 10, 7, 5, 2],
        [0, 4, 7, 11, 14, 11, 7, 4],
        [0, 1, 5, 7, 8, 7, 5, 1],
      ],
      base = [146.83, 130.81, 164.81, 110][this.act];
    const i = this.step++;
    this.tone(
      base * 2 ** (scales[this.act][i % 8] / 12),
      0.65,
      "triangle",
      0.018,
    );
    if (i % 4 === 0) this.tone(base / 2, 1.2, "sine", 0.045);
    if (this.boss) this.tone(i % 2 ? base : base / 2, 0.12, "square", 0.012);
  }
  effect(kind: string) {
    if (kind === "damage") this.tone(260, 0.08, "triangle", 0.025);
    if (kind === "hurt") this.tone(75, 0.15, "sawtooth", 0.025);
    if (kind === "loot" || kind === "heal") {
      this.tone(520, 0.2);
      this.tone(780, 0.25, "sine", 0.025, 0.08);
    }
    if (kind === "ultimate")
      for (let i = 0; i < 5; i++)
        this.tone(180 * 2 ** (i / 3), 0.7, "triangle", 0.045, i * 0.1);
  }
}
