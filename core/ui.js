import { osState, subscribeState } from './state.js';
import { listDir } from './fs.js';
import { createContextMenu } from '../components/menu/contextMenu.js';
import { getAppRegistry } from '../apps/index.js';
import { WindowManager } from './wm.js';

const APP_ICON = {
  settings: '⚙',
  browser: '🌐',
  files: '🗂',
  games: '🎮',
};

function iconGlyph(appId) {
  return APP_ICON[appId] ?? '⬢';
}

function renderDesktopShortcuts({ desktopGrid, openApp }) {
  const items = listDir('/Desktop');
  desktopGrid.innerHTML = '';

  for (const item of items) {
    const button = document.createElement('button');
    button.className = 'desktop-shortcut';
    button.type = 'button';
    button.innerHTML = `
      <span class="desktop-shortcut__icon" data-lucide="${item.appId ?? 'file'}">${iconGlyph(item.appId)}</span>
      <span class="desktop-shortcut__label">${item.name}</span>
    `;
    button.addEventListener('dblclick', () => {
      if (item.type === 'app' && item.appId) {
        openApp(item.appId);
      }
    });
    desktopGrid.append(button);
  }

  if (window.lucide?.createIcons) {
    window.lucide.createIcons();
  }
}

function renderTaskbarApps(taskbarApps) {
  const active = osState.openProcesses.filter((process) => process.workspace === osState.activeWorkspace);
  taskbarApps.innerHTML = '';

  for (const process of active) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `task-chip ${process.id === osState.focusedWindowId ? 'active' : ''}`;
    chip.textContent = `${iconGlyph(process.appId)} ${process.title}`;
    taskbarApps.append(chip);
  }
}

function updateClock() {
  const clock = document.getElementById('tray-clock');
  if (!clock) return;
  clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export async function initUI() {
  const desktopGrid = document.getElementById('desktop-grid');
  const startMenu = document.getElementById('start-menu');
  const startButton = document.getElementById('start-button');
  const taskbarApps = document.getElementById('taskbar-apps');
  const windowLayer = document.getElementById('window-layer');

  const appRegistry = await getAppRegistry();
  const wm = new WindowManager({
    layer: windowLayer,
    appRegistry,
  });

  const openApp = (appId, payload) => wm.open(appId, payload);

  startButton?.addEventListener('click', () => {
    const hidden = startMenu.classList.toggle('hidden');
    startMenu.setAttribute('aria-hidden', String(hidden));
  });

  startMenu.innerHTML = Object.entries(appRegistry)
    .map(([appId, app]) => `<button class="start-item" data-app="${appId}">${iconGlyph(appId)} ${app.title}</button>`)
    .join('');

  startMenu.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-app]');
    if (!button) return;
    openApp(button.dataset.app);
    startMenu.classList.add('hidden');
  });

  createContextMenu({
    target: desktopGrid,
    items: [
      {
        label: 'New Folder',
        onSelect: () => openApp('files', { path: '/Desktop', createFolder: true }),
      },
      {
        label: 'Open Settings',
        onSelect: () => openApp('settings'),
      },
    ],
  });

  renderDesktopShortcuts({ desktopGrid, openApp });
  renderTaskbarApps(taskbarApps);
  updateClock();
  window.setInterval(updateClock, 1000 * 30);

  subscribeState(() => {
    renderTaskbarApps(taskbarApps);
    renderDesktopShortcuts({ desktopGrid, openApp });
  });
}
