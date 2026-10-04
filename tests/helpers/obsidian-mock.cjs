module.exports = function installObsidianMock() {
  Node.prototype.createEl = function (tag, options = {}) {
    const e = (this.ownerDocument ?? document).createElement(tag);
    if (options.cls) e.className = options.cls;
    if (options.text) e.textContent = options.text;
    for (const [k, v] of Object.entries(options.attr || {})) e.setAttribute(k, v);
    if (options.prepend) this.prepend(e);
    else this.appendChild(e);
    return e;
  };
  Node.prototype.createDiv = function (options = {}) {
    return this.createEl('div', options);
  };
  Element.prototype.empty = function () {
    this.replaceChildren();
  };
  Node.prototype.createSvg = function (tag, options = {}) {
    const e = (this.ownerDocument ?? document).createElementNS('http://www.w3.org/2000/svg', tag);
    if (options.cls) e.setAttribute('class', options.cls);
    for (const [k, v] of Object.entries(options.attr || {})) e.setAttribute(k, v);
    this.appendChild(e);
    return e;
  };
  Object.defineProperty(Node.prototype, 'win', {
    configurable: true,
    get() {
      return this.ownerDocument?.defaultView ?? window;
    },
  });
  const setCssStyles = function (styles) {
    Object.assign(this.style, styles);
  };
  HTMLElement.prototype.setCssStyles = SVGElement.prototype.setCssStyles = setCssStyles;
  class MarkdownView {}
  class Plugin {
    constructor() {
      this.app = {
        workspace: {
          containerEl: document.body,
          onLayoutReady: (fn) => fn(),
          getActiveViewOfType: () => ({ containerEl: document.querySelector('main') }),
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
    addCommand(command) {
      this.command = command;
    }
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
    MarkdownView,
    Modal,
    Scope,
    PluginSettingTab: class {
      constructor(app, plugin) {
        this.app = app;
        this.plugin = plugin;
        this.containerEl = document.createElement('div');
      }
    },
    Setting: class {
      constructor(parent) {
        this.settingEl = parent.createDiv({ cls: 'setting-item' });
        this.nameEl = this.settingEl.createDiv({ cls: 'setting-item-name' });
        this.descEl = this.settingEl.createDiv({ cls: 'setting-item-description' });
      }
      setName(value) {
        this.nameEl.textContent = value;
        return this;
      }
      setDesc(value) {
        this.descEl.textContent = value;
        return this;
      }
      addText(callback) {
        const inputEl = this.settingEl.createEl('input');
        const text = {
          inputEl,
          setPlaceholder(value) {
            inputEl.placeholder = value;
            return this;
          },
          setValue(value) {
            inputEl.value = value;
            return this;
          },
          getValue() {
            return inputEl.value;
          },
        };
        callback(text);
        return this;
      }
    },
    Notice: class {},
    setIcon,
  };
};
