import { resetFS } from '../../core/fs.js';

async function loadPanel(name) {
  const url = new URL(`./panels/${name}.html`, import.meta.url);
  const response = await fetch(url);
  return response.text();
}

function applyTheme(themeName) {
  let link = document.getElementById('theme-sheet');
  if (!link) {
    link = document.createElement('link');
    link.id = 'theme-sheet';
    link.rel = 'stylesheet';
    document.head.append(link);
  }

  link.href = `./assets/css/${themeName}.css`;
  localStorage.setItem('restart.theme', themeName);
}

function setScale(value) {
  document.documentElement.style.setProperty('--desktop-scale', value);
  localStorage.setItem('restart.desktopScale', value);
}

function setDockMode(enabled) {
  document.body.classList.toggle('taskbar-dock', enabled);
  document.documentElement.style.setProperty('--taskbar-style', enabled ? 'dock' : 'default');
  localStorage.setItem('restart.taskbarStyle', enabled ? 'dock' : 'default');
}

export function createSettingsApp() {
  return {
    title: 'Settings',
    icon: 'settings',
    async mount({ host }) {
      host.innerHTML = `
        <div class="settings-app">
          <nav class="settings-nav">
            <button type="button" data-panel="appearance">Appearance</button>
            <button type="button" data-panel="system">System</button>
          </nav>
          <section class="settings-panel"></section>
        </div>
      `;

      const panel = host.querySelector('.settings-panel');
      const nav = host.querySelector('.settings-nav');

      const showPanel = async (name) => {
        panel.innerHTML = await loadPanel(name);

        if (name === 'appearance') {
          const themeSelect = panel.querySelector('#theme-select');
          const scaleRange = panel.querySelector('#scale-range');
          const dockToggle = panel.querySelector('#dock-toggle');

          const currentTheme = localStorage.getItem('restart.theme') || 'theme-dark-glass';
          const currentScale = localStorage.getItem('restart.desktopScale') || '1';
          const taskbarStyle = localStorage.getItem('restart.taskbarStyle') || 'default';

          themeSelect.value = currentTheme;
          scaleRange.value = currentScale;
          dockToggle.checked = taskbarStyle === 'dock';

          themeSelect.addEventListener('change', () => applyTheme(themeSelect.value));
          scaleRange.addEventListener('input', () => setScale(scaleRange.value));
          dockToggle.addEventListener('change', () => setDockMode(dockToggle.checked));
        }

        if (name === 'system') {
          panel.querySelector('#reset-storage')?.addEventListener('click', () => {
            resetFS();
          });
        }
      };

      nav.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-panel]');
        if (!button) return;
        showPanel(button.dataset.panel);
      });

      await showPanel('appearance');
    },
  };
}
