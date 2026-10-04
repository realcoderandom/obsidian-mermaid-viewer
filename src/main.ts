import { MarkdownView, Notice, Plugin } from 'obsidian';
import { diagramMetadata } from './diagram/metadata';
import { NoteObserver } from './integration/note-observer';
import {
  DEFAULT_SETTINGS,
  normalizeSettings,
  ViewerSettingsTab,
  type ViewerSettings,
} from './settings';
import { decorate } from './theme/decorate';
import { DiagramModal } from './viewer/modal';

/** Composition root: settings, note integration and modal lifetime only. */
export default class MermaidViewer extends Plugin {
  settings = { ...DEFAULT_SETTINGS };
  readonly modals = new Set<DiagramModal>();
  private notes?: NoteObserver;
  private unloaded = false;

  async onload(): Promise<void> {
    this.settings = normalizeSettings(await this.loadData());
    if (this.unloaded) return;
    this.addSettingTab(new ViewerSettingsTab(this.app, this));
    this.app.workspace.onLayoutReady(() => {
      if (this.unloaded) return;
      this.notes = new NoteObserver(
        this.app.workspace.containerEl,
        () => this.settings,
        (svg) => this.metadata(svg),
        (svg) => this.open(svg),
      );
    });
    this.addCommand({
      id: 'open-current-diagram',
      name: '全屏查看当前笔记的 Mermaid 图',
      callback: () => {
        const scope = this.app.workspace.getActiveViewOfType(MarkdownView)?.containerEl;
        const diagrams = Array.from(
          scope?.querySelectorAll<SVGSVGElement>('.mermaid > svg') ?? [],
        ).filter((svg) => this.notes?.eligible(svg));
        const svg =
          diagrams.find((el) => {
            const rect = el.getBoundingClientRect();
            return rect.bottom > 0 && rect.top < (el.ownerDocument.defaultView?.innerHeight ?? 0);
          }) ?? diagrams[0];
        if (svg) this.open(svg);
        else new Notice('当前笔记没有可查看的 Mermaid 图表，请检查插件设置中的应用范围。');
      },
    });
  }

  metadata(svg: SVGSVGElement) {
    return diagramMetadata(this.app, svg);
  }

  private open(svg: SVGSVGElement): void {
    const active = [...this.modals][0];
    if (active) {
      active.focus();
      return;
    }
    decorate(svg);
    const modal = new DiagramModal(this.app, svg, this.metadata(svg), () =>
      this.modals.delete(modal),
    );
    this.modals.add(modal);
    modal.open();
  }

  async updateSettings(value: ViewerSettings): Promise<void> {
    const next = normalizeSettings(value);
    // Persist first: a failed save must not leave settings and rendered scope split.
    try {
      await this.saveData(next);
    } catch {
      new Notice('设置保存失败，请检查 Vault 的写入权限。');
      return;
    }
    this.settings = next;
    this.modals.forEach((modal) => modal.close());
    this.notes?.refresh();
  }

  onunload(): void {
    this.unloaded = true;
    this.notes?.dispose();
    this.modals.forEach((modal) => modal.close());
  }
}
