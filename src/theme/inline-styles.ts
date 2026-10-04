/** Temporarily remove only inline declarations covered by our theme's CSS rules.
 * Mermaid's geometry, transforms and unrelated diagram styles remain untouched.
 */
type StyledElement = SVGElement | HTMLElement;
interface SavedStyle {
  element: StyledElement;
  original: string;
  themed: string;
  properties: Map<string, { value: string; priority: string }>;
}
const originals = new WeakMap<SVGSVGElement, SavedStyle[]>();

export function prepareThemeStyles(svg: SVGSVGElement, css: string): string {
  const win = svg.ownerDocument.defaultView ?? window;
  const sheet = new win.CSSStyleSheet();
  sheet.replaceSync(css);
  const saved = new Map<StyledElement, SavedStyle>();
  for (const rule of Array.from(sheet.cssRules)) {
    if (!(rule instanceof win.CSSStyleRule)) continue;
    const elements = Array.from(svg.querySelectorAll<StyledElement>(rule.selectorText));
    if (svg.matches(rule.selectorText)) elements.unshift(svg);
    for (const element of elements) {
      for (const property of Array.from(rule.style)) {
        if (property.startsWith('--')) continue;
        const value = element.style.getPropertyValue(property);
        if (!value) continue;
        let record = saved.get(element);
        if (!record) {
          record = {
            element,
            original: element.getAttribute('style') ?? '',
            themed: '',
            properties: new Map(),
          };
          saved.set(element, record);
        }
        record.properties.set(property, {
          value,
          priority: element.style.getPropertyPriority(property),
        });
        element.style.removeProperty(property);
      }
    }
  }
  for (const record of saved.values()) record.themed = record.element.style.cssText;
  originals.set(svg, [...saved.values()]);
  // Mermaid scopes its own rules with an ID. Use that same ID plus our class,
  // so normal CSS specificity suffices without overriding the whole vault.
  return svg.id
    ? css.replaceAll('svg.mpv-diagram', `svg#${win.CSS.escape(svg.id)}.mpv-diagram`)
    : css;
}

export function restoreThemeStyles(svg: SVGSVGElement): void {
  for (const record of originals.get(svg) ?? []) {
    const { element } = record;
    if (element.style.cssText === record.themed) {
      element.setAttribute('style', record.original);
    } else {
      // Preserve changes made by the note renderer or another plugin meanwhile.
      for (const [property, { value, priority }] of record.properties) {
        if (!element.style.getPropertyValue(property))
          element.style.setProperty(property, value, priority);
      }
    }
  }
  originals.delete(svg);
}
