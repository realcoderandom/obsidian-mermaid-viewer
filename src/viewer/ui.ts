import { setIcon } from 'obsidian';
import { ROLES } from '../theme/roles';
import type { DiagramMetadata } from '../diagram/types';

export function iconButton(
  parent: HTMLElement,
  icon: string,
  label: string,
  action: () => void,
  signal: AbortSignal,
): HTMLButtonElement {
  const button = parent.createEl('button', {
    cls: 'mpv-icon-button',
    attr: { type: 'button', title: label, 'aria-label': label },
  });
  setIcon(button, icon);
  button.addEventListener('click', action, { signal });
  return button;
}

export function legend(parent: HTMLElement, svg: SVGSVGElement): void {
  const roles = new Set(
    Array.from(svg.querySelectorAll('[data-mpv-role]'), (el) => el.getAttribute('data-mpv-role')),
  );
  const el = parent.createDiv({ cls: 'mpv-diagram-legend' });
  for (const [role, info] of Object.entries(ROLES)) {
    if (!roles.has(role)) continue;
    const item = el.createSpan({
      cls: 'mpv-diagram-legend-item',
      attr: { 'data-role': role },
    });
    item.createEl('i', { attr: { 'aria-hidden': 'true' } });
    item.createSpan({ text: info.label });
  }
}

export interface UIActions {
  close(): void;
  fit(): void;
  fitWidth(): void;
  actualSize(): void;
  zoomCenter(factor: number): void;
}
export function createViewerUI(
  parent: HTMLElement,
  meta: DiagramMetadata,
  actions: UIActions,
  signal: AbortSignal,
) {
  const header = parent.createDiv({ cls: 'mpv-diagram-header' });
  const identity = header.createDiv({ cls: 'mpv-diagram-identity' });
  identity.createSpan({ cls: 'mpv-diagram-kind', text: meta.kind });
  identity.createEl('h2', { text: meta.title, attr: { title: meta.title } });
  if (meta.file.replace(/^\d+[-_\s]*/, '') !== meta.title)
    identity.createSpan({ cls: 'mpv-diagram-file', text: meta.file });
  const headerActions = header.createDiv({ cls: 'mpv-diagram-actions' });
  const helpButton = iconButton(
    headerActions,
    'circle-help',
    '操作说明',
    () => {
      help.hidden = !help.hidden;
      helpButton.setAttribute('aria-expanded', String(!help.hidden));
    },
    signal,
  );
  helpButton.setAttribute('aria-expanded', 'false');
  iconButton(headerActions, 'x', '关闭（Esc）', () => actions.close(), signal);

  const help = parent.createDiv({
    cls: 'mpv-diagram-help',
    attr: { role: 'region', 'aria-label': '操作说明与图例' },
  });
  help.createEl('strong', { text: '查看图表' });
  for (const [keys, label] of [
    ['滚轮 / 拖动', '平移图表'],
    ['Ctrl / ⌘ + 滚轮', '以指针为中心缩放'],
    ['双指捏合', '缩放'],
    ['＋ / −', '放大 / 缩小'],
    ['F / 0', '完整显示'],
    ['W', '适合宽度'],
    ['1', '原始尺寸'],
    ['方向键', '平移'],
    ['Esc', '关闭'],
  ]) {
    const row = help.createDiv({ cls: 'mpv-help-row' });
    row.createSpan({ text: keys });
    row.createSpan({ text: label });
  }
  help.hidden = true;
  // Obsidian turns aria-label into a hover tooltip; use a referenced label
  // so the canvas does not show a large tooltip over the view controls.
  const canvasLabel = `mpv-canvas-${Date.now()}`;
  parent.createSpan({
    cls: 'mpv-sr-only',
    text: '图表画布。滚轮平移，Ctrl 或 Command 加滚轮缩放。',
    attr: { id: canvasLabel },
  });
  const stage = parent.createDiv({
    cls: 'mpv-diagram-stage',
    attr: { tabindex: '0', 'aria-labelledby': canvasLabel },
  });
  const canvas = stage.createDiv({ cls: 'mpv-diagram-canvas' });
  const toolbar = parent.createDiv({
    cls: 'mpv-diagram-toolbar',
    attr: { role: 'group', 'aria-label': '图表视图控制' },
  });
  const modes = toolbar.createDiv({ cls: 'mpv-diagram-modes' });
  const button = (label: string, action: () => void, title: string) => {
    const el = modes.createEl('button', {
      cls: 'mpv-text-button',
      text: label,
      attr: { type: 'button', title, 'aria-pressed': 'false' },
    });
    el.addEventListener('click', action, { signal: signal });
    return el;
  };
  const fitButton = button('完整显示', () => actions.fit(), '完整显示（F / 0）');
  const widthButton = button('适合宽度', () => actions.fitWidth(), '适合宽度（W）');
  const actualButton = button('原始尺寸', () => actions.actualSize(), '原始尺寸（1）');
  const zoom = toolbar.createDiv({ cls: 'mpv-diagram-zoom' });
  const zoomOut = iconButton(zoom, 'minus', '缩小', () => actions.zoomCenter(1 / 1.25), signal);
  const counter = zoom.createSpan({
    cls: 'mpv-diagram-scale',
    text: '100%',
    attr: { 'aria-label': '当前缩放比例' },
  });
  const zoomIn = iconButton(zoom, 'plus', '放大', () => actions.zoomCenter(1.25), signal);
  toolbar.createSpan({ cls: 'mpv-diagram-hint', text: '滚轮平移 · Ctrl / ⌘ + 滚轮缩放' });

  return {
    help,
    helpButton,
    stage,
    canvas,
    counter,
    fitButton,
    widthButton,
    actualButton,
    zoomIn,
    zoomOut,
  };
}
export type ViewerUI = ReturnType<typeof createViewerUI>;
