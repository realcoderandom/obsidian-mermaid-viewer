module.exports = function installObsidianMock() {
  Element.prototype.createEl = function (tag, options = {}) {
    const e = document.createElement(tag);
    if (options.cls) e.className = options.cls;
    if (options.text) e.textContent = options.text;
    for (const [k, v] of Object.entries(options.attr || {})) e.setAttribute(k, v);
    this.appendChild(e);
    return e;
  };
  Element.prototype.createDiv = function (options = {}) {
    return this.createEl('div', options);
  };
  Element.prototype.empty = function () {
    this.replaceChildren();
  };
  class Plugin {
    constructor() {
      this.app = {
        workspace: {
          containerEl: document.body,
          onLayoutReady: (fn) => fn(),
          getLeavesOfType: () => [
            {
              containerEl: document.querySelector('main'),
              view: { containerEl: document.querySelector('main'), file: { basename: '示例笔记' } },
            },
          ],
        },
      };
      this.cleanups = [];
    }
    async loadData() {
      return window.savedSettings ?? { noteClass: 'mermaid-notes' };
    }
    async saveData(value) {
      window.savedSettings = value;
    }
    addSettingTab(tab) {
      this.settingsTab = tab;
    }
    register(f) {
      this.cleanups.push(f);
    }
    registerDomEvent(el, type, fn) {
      el.addEventListener(type, fn);
      this.register(() => el.removeEventListener(type, fn));
    }
    addCommand() {}
    unload() {
      this.onunload();
      this.cleanups.forEach((f) => f());
    }
  }
  class Scope {
    constructor(parent) {
      this.parent = parent;
      this.keys = [];
    }
    register(modifiers, key, func) {
      this.keys.push({ key, func });
    }
    handleKey(event) {
      const entry = this.keys.find((k) => k.key === event.key);
      return entry ? entry.func(event) : this.parent?.handleKey(event);
    }
  }
  class Modal {
    constructor() {
      this.scope = new Scope();
      this.scope.register([], 'Escape', () => {
        this.close();
        return false;
      });
      this.containerEl = document.createElement('div');
      this.containerEl.className = 'modal-container';
      this.modalEl = this.containerEl.createDiv({ cls: 'modal' });
      this.titleEl = this.modalEl.createDiv({ cls: 'modal-title' });
      this.contentEl = this.modalEl.createDiv({ cls: 'modal-content' });
    }
    open() {
      document.body.appendChild(this.containerEl);
      this.onOpen();
      this.escape = (e) => {
        if (this.scope.handleKey(e) === false) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      };
      document.addEventListener('keydown', this.escape, true);
    }
    close() {
      document.removeEventListener('keydown', this.escape, true);
      this.onClose();
      this.containerEl.remove();
    }
  }
  const setIcon = (el, icon) => {
    const paths = {
      x: 'M6 6l12 12M18 6 6 18',
      minus: 'M5 12h14',
      plus: 'M5 12h14M12 5v14',
      'maximize-2': 'M8 3H3v5M16 21h5v-5M3 3l6 6M21 21l-6-6',
      'grid-2x2': 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
      'circle-help': 'M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3M12 17h.01',
    };
    el.innerHTML =
      '<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="' +
      (paths[icon] || paths.plus) +
      '"/></svg>';
  };
  window.obsidianMock = {
    Plugin,
    Modal,
    Scope,
    PluginSettingTab: class {
      constructor(app, plugin) {
        this.app = app;
        this.plugin = plugin;
        this.containerEl = document.createElement('div');
      }
    },
    Setting: class {},
    Notice: class {},
    setIcon,
  };
};
