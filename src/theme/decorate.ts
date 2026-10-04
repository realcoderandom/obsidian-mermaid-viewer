import { prepareThemeStyles, restoreThemeStyles } from './inline-styles';
import svgStyle from './svg.css';
import { SEMANTIC_ROLES, type Role } from './roles';
export { ROLES } from './roles';

export function roleFor(classes: Iterable<string>): Role {
  for (const name of classes) {
    const role = SEMANTIC_ROLES[name];
    if (role) return role;
  }
  return 'neutral';
}

export function decorate(svg: SVGSVGElement): void {
  if (svg.classList.contains('mpv-diagram') && svg.querySelector('[data-mpv-style]')) return;
  clean(svg);
  svg.classList.add('mpv-diagram');
  const actorGroups = new Set(
    Array.from(svg.querySelectorAll('text.actor'), (text) => text.parentElement).filter(
      (el): el is HTMLElement => el !== null,
    ),
  );
  for (const group of actorGroups) group.setAttribute('data-mpv-role', roleFor(group.classList));
  svg.querySelectorAll('g.node').forEach((node) => {
    node.setAttribute('data-mpv-role', roleFor(node.classList));
  });
  const css = svg.querySelector('text.actor, g.node')
    ? svgStyle
    : 'svg.mpv-diagram { background: transparent; }';
  const themed = prepareThemeStyles(svg, css);
  const style = svg.createSvg('style', { attr: { 'data-mpv-style': 'paper' } });
  style.textContent = themed;
}

export function clean(svg: SVGSVGElement): void {
  restoreThemeStyles(svg);
  svg.querySelectorAll('[data-mpv-style]').forEach((el) => el.remove());
  svg.querySelectorAll('[data-mpv-role]').forEach((el) => el.removeAttribute('data-mpv-role'));
  svg.classList.remove('mpv-diagram');
}
