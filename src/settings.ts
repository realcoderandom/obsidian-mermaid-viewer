import { Notice, PluginSettingTab, Setting, type App, type Plugin } from 'obsidian';
import { validNoteClass, type ViewerSettings } from './settings-model';
export { DEFAULT_SETTINGS, normalizeSettings, type ViewerSettings } from './settings-model';

interface SettingsHost extends Plugin {
  settings: ViewerSettings;
  updateSettings(settings: ViewerSettings): Promise<void>;
}
export class ViewerSettingsTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly host: SettingsHost,
  ) {
    super(app, host);
  }
  display(): void {
    this.containerEl.empty();
    new Setting(this.containerEl)
      .setName('图表应用范围')
      .setDesc('填写一个笔记 cssclasses 名称；留空时应用到所有笔记的 Mermaid 图表。')
      .addText((text) => {
        text.setPlaceholder('留空表示所有笔记').setValue(this.host.settings.noteClass);
        // Save on blur, not on every keystroke: changing the scope rebuilds note controls.
        text.inputEl.addEventListener('change', () => {
          const noteClass = text.getValue().trim();
          if (!validNoteClass(noteClass)) {
            new Notice('请填写单个 CSS 类名，不要添加点号或空格。');
            text.setValue(this.host.settings.noteClass);
            return;
          }
          void this.host.updateSettings({ ...this.host.settings, noteClass });
        });
      });
    new Setting(this.containerEl)
      .setName('节点配色规则')
      .setDesc('自动识别 focus、step、store、branch、ext、err 节点类；未分类节点使用中性色。');
  }
}
