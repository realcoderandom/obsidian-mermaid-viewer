/** SVG camera math. No DOM or Obsidian imports; coordinates remain fractional. */
export interface Size {
  width: number;
  height: number;
}
export interface Point {
  x: number;
  y: number;
}
export type ViewMode = 'fit' | 'width' | 'actual' | 'manual';
export const MAX_SCALE = 8;
const FIT_PADDING = 64;
const WIDTH_PADDING = 80;

export class Camera {
  x = 0;
  y = 0;
  scale = 1;
  viewMode: ViewMode = 'fit';
  private size: Size = { width: 1, height: 1 };

  constructor(readonly bounds: Size) {
    if (![bounds.width, bounds.height].every((v) => Number.isFinite(v) && v > 0)) {
      throw new Error('Diagram dimensions must be finite and positive.');
    }
  }

  resize(size: Size): void {
    if (![size.width, size.height].every((v) => Number.isFinite(v) && v > 0)) return;
    this.size = size;
    if (this.viewMode === 'fit') this.fit();
    else if (this.viewMode === 'width') this.fitWidth();
  }

  initialView(): void {
    if (this.bounds.height / this.bounds.width > (this.size.height / this.size.width) * 1.4)
      this.fitWidth();
    else this.fit();
  }

  fit(): void {
    const { width, height } = this.size;
    this.viewMode = 'fit';
    this.scale = Math.min(
      1,
      Math.max(1, width - FIT_PADDING) / this.bounds.width,
      Math.max(1, height - FIT_PADDING) / this.bounds.height,
    );
    this.x = (width - this.bounds.width * this.scale) / 2;
    this.y = (height - this.bounds.height * this.scale) / 2;
  }

  fitWidth(): void {
    this.viewMode = 'width';
    this.scale = Math.min(1, Math.max(1, this.size.width - WIDTH_PADDING) / this.bounds.width);
    this.centerFromTop();
  }

  actualSize(): void {
    this.scale = 1;
    this.viewMode = 'actual';
    this.centerFromTop();
  }

  private centerFromTop(): void {
    this.x = (this.size.width - this.bounds.width * this.scale) / 2;
    this.y = Math.max(32, (this.size.height - this.bounds.height * this.scale) / 2);
  }

  get minimumScale(): number {
    return Math.min(
      0.05,
      Math.max(1, this.size.width - FIT_PADDING) / this.bounds.width,
      Math.max(1, this.size.height - FIT_PADDING) / this.bounds.height,
    );
  }

  zoomTo(value: number, anchor: Point): void {
    if (![value, anchor.x, anchor.y].every(Number.isFinite)) return;
    const next = Math.max(this.minimumScale, Math.min(MAX_SCALE, value));
    const ratio = next / this.scale;
    this.x = anchor.x - (anchor.x - this.x) * ratio;
    this.y = anchor.y - (anchor.y - this.y) * ratio;
    this.scale = next;
    this.viewMode = 'manual';
  }

  zoomCenter(factor: number): void {
    this.zoomTo(this.scale * factor, { x: this.size.width / 2, y: this.size.height / 2 });
  }

  pan(dx: number, dy: number): void {
    if (![dx, dy].every(Number.isFinite)) return;
    this.x += dx;
    this.y += dy;
    this.viewMode = 'manual';
  }

  get viewBox(): string {
    return `${-this.x / this.scale} ${-this.y / this.scale} ${this.size.width / this.scale} ${this.size.height / this.scale}`;
  }
}
