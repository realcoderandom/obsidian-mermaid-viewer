import {
  Notice,
  PluginSettingTab,
  Setting,
  type App,
  type Plugin,
  type SettingDefinition,
} from 'obsidian';
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
  getSettingDefinitions(): SettingDefinition[] {
    return [
      {
        name: '图表应用范围',
        desc: '填写一个笔记 cssclasses 名称；留空时应用到所有笔记的 Mermaid 图表。',
        aliases: ['Mermaid', 'scope', 'cssclasses'],
        render: (setting) => this.addScopeControl(setting),
      },
      {
        name: '节点配色规则',
        desc: '自动识别 focus、step、store、branch、ext、err 节点类；未分类节点使用中性色。',
        aliases: ['Mermaid', 'colors', 'palette'],
      },
    ];
  }

  // Obsidian < 1.13 renders this fallback; newer versions use the searchable definitions.
  display(): void {
    this.containerEl.empty();
    for (const definition of this.getSettingDefinitions()) {
      const setting = new Setting(this.containerEl)
        .setName(definition.name)
        .setDesc(definition.desc ?? '');
      if (definition.render) this.addScopeControl(setting);
    }
  }

  private addScopeControl(setting: Setting): void {
    setting.addText((text) => {
      text.setPlaceholder('留空表示所有笔记').setValue(this.host.settings.noteClass);
      // Commit on blur so typing never rebuilds every diagram in the vault.
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
  }
}
