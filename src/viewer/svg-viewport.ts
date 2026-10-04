import type { Size } from './camera';

export function createSvgViewport(
  source: SVGSVGElement,
  canvas: HTMLElement,
): {
  viewport: SVGSVGElement;
  content: SVGSVGElement;
  bounds: Size;
} {
  const content = source.cloneNode(true) as SVGSVGElement;
  content.classList.add('mpv-svg-content');
  const box = source.viewBox.baseVal;
  const rect = source.getBoundingClientRect();
  const valid = (...values: number[]) =>
    values.find((value) => Number.isFinite(value) && value > 0) ?? 1;
  const bounds = {
    width: valid(box.width, source.width.baseVal.value, rect.width, 800),
    height: valid(box.height, source.height.baseVal.value, rect.height, 600),
  };
  // Preserve the nested viewport: Mermaid percentages and HTML labels depend on it.
  content.setAttribute('width', String(bounds.width));
  content.setAttribute('height', String(bounds.height));
  content.setAttribute('x', '0');
  content.setAttribute('y', '0');
  content.setCssStyles({
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
    maxWidth: 'none',
    maxHeight: 'none',
    overflow: 'hidden',
  });
  const viewport = canvas.createSvg('svg', { cls: 'mpv-svg-viewport' });
  viewport.setAttribute('preserveAspectRatio', 'none');
  viewport.appendChild(content);
  return { viewport, content, bounds };
}
