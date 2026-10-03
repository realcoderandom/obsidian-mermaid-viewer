import type { Size } from './camera';

const SVG_NS = 'http://www.w3.org/2000/svg';
const SHADOW_STYLE =
  ':host{display:block}svg{display:block;max-width:none!important;max-height:none!important}.mpv-svg-viewport{width:100%;height:100%;overflow:hidden}p{margin:0}';

export function createSvgViewport(
  source: SVGSVGElement,
  canvas: HTMLElement,
): {
  viewport: SVGSVGElement;
  content: SVGSVGElement;
  bounds: Size;
} {
  const doc = canvas.ownerDocument;
  const shadow = canvas.attachShadow({ mode: 'open' });
  const style = doc.createElement('style');
  style.textContent = SHADOW_STYLE;
  shadow.appendChild(style);
  const content = source.cloneNode(true) as SVGSVGElement;
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
  content.style.width = `${bounds.width}px`;
  content.style.height = `${bounds.height}px`;
  content.style.maxWidth = 'none';
  content.style.maxHeight = 'none';
  content.style.overflow = 'hidden';
  const viewport = doc.createElementNS(SVG_NS, 'svg');
  viewport.classList.add('mpv-svg-viewport');
  viewport.setAttribute('preserveAspectRatio', 'none');
  viewport.appendChild(content);
  shadow.appendChild(viewport);
  return { viewport, content, bounds };
}
