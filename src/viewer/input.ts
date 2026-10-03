import type { Camera, Point } from './camera';

export interface ViewActions {
  fit(): void;
  fitWidth(): void;
  actualSize(): void;
}

/** Owns gesture state and listeners. Closing a modal always disposes this object. */
export class ViewerInput {
  readonly pointers = new Map<number, Point>();
  private readonly events = new AbortController();

  constructor(
    private readonly stage: HTMLElement,
    keyboardRoot: HTMLElement,
    camera: Camera,
    render: () => void,
    actions: ViewActions,
  ) {
    const options = { signal: this.events.signal };
    const anchor = (x: number, y: number) => {
      const rect = stage.getBoundingClientRect();
      return { x: x - rect.left, y: y - rect.top };
    };
    stage.addEventListener(
      'wheel',
      (event) => {
        event.preventDefault();
        if (this.pointers.size) return;
        const unit =
          event.deltaMode === 1
            ? 16
            : event.deltaMode === 2
              ? stage.getBoundingClientRect().height
              : 1;
        if (event.ctrlKey || event.metaKey) {
          const factor = Math.exp(-Math.max(-200, Math.min(200, event.deltaY * unit)) * 0.002);
          camera.zoomTo(camera.scale * factor, anchor(event.clientX, event.clientY));
        } else {
          camera.pan(
            -(event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX) * unit,
            -(event.shiftKey && !event.deltaX ? 0 : event.deltaY) * unit,
          );
        }
        render();
      },
      { ...options, passive: false },
    );
    stage.addEventListener(
      'pointerdown',
      (event) => {
        if (event.button !== 0 || this.pointers.size >= 2) return;
        event.preventDefault();
        stage.focus({ preventScroll: true });
        this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        stage.setPointerCapture(event.pointerId);
        stage.classList.add('is-dragging');
      },
      options,
    );
    stage.addEventListener(
      'pointermove',
      (event) => {
        const old = this.pointers.get(event.pointerId);
        if (!old) return;
        const before = [...this.pointers.values()];
        this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        const after = [...this.pointers.values()];
        const a1 = before[0],
          a2 = before[1],
          b1 = after[0],
          b2 = after[1];
        if (a1 && a2 && b1 && b2) {
          const a = { x: (a1.x + a2.x) / 2, y: (a1.y + a2.y) / 2 };
          const b = { x: (b1.x + b2.x) / 2, y: (b1.y + b2.y) / 2 };
          const distance = (p: Point, q: Point) => Math.hypot(p.x - q.x, p.y - q.y);
          camera.zoomTo(
            (camera.scale * distance(b1, b2)) / Math.max(1, distance(a1, a2)),
            anchor(a.x, a.y),
          );
          camera.pan(b.x - a.x, b.y - a.y);
        } else camera.pan(event.clientX - old.x, event.clientY - old.y);
        render();
      },
      options,
    );
    const end = (event: PointerEvent) => this.releasePointer(event.pointerId);
    stage.addEventListener('pointerup', end, options);
    stage.addEventListener('pointercancel', end, options);
    stage.addEventListener('lostpointercapture', end, options);
    stage.addEventListener(
      'dblclick',
      (event) => {
        camera.zoomTo(
          camera.scale * (event.shiftKey ? 0.5 : 2),
          anchor(event.clientX, event.clientY),
        );
        render();
      },
      options,
    );
    stage.ownerDocument.defaultView?.addEventListener('blur', () => this.resetPointers(), options);
    keyboardRoot.addEventListener(
      'keydown',
      (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey || this.pointers.size) return;
        const target = event.target as HTMLElement | null;
        if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
        const key = event.key.toLowerCase();
        const movement: Record<string, Point> = {
          arrowleft: { x: 40, y: 0 },
          arrowright: { x: -40, y: 0 },
          arrowup: { x: 0, y: 40 },
          arrowdown: { x: 0, y: -40 },
        };
        const delta = movement[key];
        if (delta) {
          camera.pan(delta.x, delta.y);
          render();
        } else if (key === '+' || key === '=') {
          camera.zoomCenter(1.25);
          render();
        } else if (key === '-') {
          camera.zoomCenter(1 / 1.25);
          render();
        } else if (key === '0' || key === 'f') actions.fit();
        else if (key === 'w') actions.fitWidth();
        else if (key === '1') actions.actualSize();
        else return;
        event.preventDefault();
        event.stopPropagation();
      },
      options,
    );
  }

  private releasePointer(id: number): void {
    this.pointers.delete(id);
    this.stage.classList.toggle('is-dragging', this.pointers.size > 0);
    if (this.stage.hasPointerCapture(id)) this.stage.releasePointerCapture(id);
  }

  private resetPointers(): void {
    for (const id of [...this.pointers.keys()]) this.releasePointer(id);
  }

  dispose(): void {
    this.events.abort();
    this.resetPointers();
  }
}
