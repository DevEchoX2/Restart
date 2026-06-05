import { createWindowMarkup } from '../components/window/windowTemplate.js';
import { createProcess, focusProcess, removeProcess, updateProcess } from './state.js';

const MIN_WIDTH = 360;
const MIN_HEIGHT = 220;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class WindowManager {
  constructor({ layer, appRegistry }) {
    this.layer = layer;
    this.appRegistry = appRegistry;
    this.activeDrag = null;
    this.activeResize = null;

    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);

    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
  }

  open(appId, payload = {}) {
    const app = this.appRegistry[appId];
    if (!app) return null;

    const process = createProcess({
      appId,
      title: app.title,
      icon: app.icon,
      payload,
    });

    this.mountWindow(process);
    this.renderApp(process, app);
    return process;
  }

  mountWindow(process) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = createWindowMarkup(process);
    const windowEl = wrapper.firstElementChild;
    this.layer.append(windowEl);

    const header = windowEl.querySelector('.window-header');
    const controls = windowEl.querySelector('.window-controls');

    header?.addEventListener('pointerdown', (event) => {
      if (event.target.closest('.window-controls')) return;
      focusProcess(process.id);
      this.startDrag(event, windowEl, process.id);
    });

    controls?.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const action = button.dataset.action;
      if (action === 'close') {
        this.close(process.id);
      } else if (action === 'minimize') {
        windowEl.classList.toggle('is-minimized');
      } else if (action === 'maximize') {
        this.toggleMaximize(process.id, windowEl);
      }
    });

    windowEl.querySelectorAll('.resize-handle').forEach((handle) => {
      handle.addEventListener('pointerdown', (event) => {
        focusProcess(process.id);
        this.startResize(event, windowEl, process.id, handle.dataset.resize);
      });
    });

    windowEl.addEventListener('pointerdown', () => focusProcess(process.id));
  }

  renderApp(process, app) {
    const host = this.layer.querySelector(`[data-window-content="${process.id}"]`);
    if (!host) return;

    const context = {
      host,
      process,
      openWindow: (id, payload) => this.open(id, payload),
      closeWindow: () => this.close(process.id),
    };

    app.mount?.(context);
  }

  close(windowId) {
    this.layer.querySelector(`[data-window-id="${windowId}"]`)?.remove();
    removeProcess(windowId);
  }

  toggleMaximize(windowId, windowEl) {
    const isMax = windowEl.classList.toggle('is-maximized');
    if (isMax) {
      windowEl.dataset.restore = JSON.stringify({
        left: windowEl.style.left,
        top: windowEl.style.top,
        width: windowEl.style.width,
        height: windowEl.style.height,
      });
      Object.assign(windowEl.style, {
        left: '0px',
        top: '0px',
        width: `${this.layer.clientWidth}px`,
        height: `${this.layer.clientHeight}px`,
      });
    } else if (windowEl.dataset.restore) {
      const restore = JSON.parse(windowEl.dataset.restore);
      Object.assign(windowEl.style, restore);
    }

    updateProcess(windowId, {
      maximized: isMax,
      bounds: {
        x: parseInt(windowEl.style.left, 10),
        y: parseInt(windowEl.style.top, 10),
        width: parseInt(windowEl.style.width, 10),
        height: parseInt(windowEl.style.height, 10),
      },
    });
  }

  startDrag(event, windowEl, windowId) {
    event.preventDefault();
    const rect = windowEl.getBoundingClientRect();
    this.activeDrag = {
      windowEl,
      windowId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
  }

  startResize(event, windowEl, windowId, edge) {
    event.preventDefault();
    const rect = windowEl.getBoundingClientRect();
    this.activeResize = {
      windowEl,
      windowId,
      edge,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
      startLeft: rect.left,
      startTop: rect.top,
    };
  }

  handlePointerMove(event) {
    if (this.activeDrag) {
      const { windowEl, offsetX, offsetY } = this.activeDrag;
      const nextLeft = clamp(event.clientX - offsetX, 0, this.layer.clientWidth - 120);
      const nextTop = clamp(event.clientY - offsetY, 0, this.layer.clientHeight - 60);
      windowEl.style.left = `${nextLeft}px`;
      windowEl.style.top = `${nextTop}px`;
      return;
    }

    if (this.activeResize) {
      const session = this.activeResize;
      const dx = event.clientX - session.startX;
      const dy = event.clientY - session.startY;

      if (session.edge === 'right' || session.edge === 'corner') {
        session.windowEl.style.width = `${Math.max(MIN_WIDTH, session.startWidth + dx)}px`;
      }

      if (session.edge === 'bottom' || session.edge === 'corner') {
        session.windowEl.style.height = `${Math.max(MIN_HEIGHT, session.startHeight + dy)}px`;
      }
    }
  }

  handlePointerUp() {
    if (this.activeDrag) {
      const { windowEl, windowId } = this.activeDrag;
      this.applySnap(windowEl);
      updateProcess(windowId, {
        bounds: {
          x: parseInt(windowEl.style.left, 10),
          y: parseInt(windowEl.style.top, 10),
          width: parseInt(windowEl.style.width, 10),
          height: parseInt(windowEl.style.height, 10),
        },
      });
      this.activeDrag = null;
    }

    if (this.activeResize) {
      const { windowEl, windowId } = this.activeResize;
      updateProcess(windowId, {
        bounds: {
          x: parseInt(windowEl.style.left, 10),
          y: parseInt(windowEl.style.top, 10),
          width: parseInt(windowEl.style.width, 10),
          height: parseInt(windowEl.style.height, 10),
        },
      });
      this.activeResize = null;
    }
  }

  applySnap(windowEl) {
    const left = parseInt(windowEl.style.left, 10) || 0;
    const rightEdge = left + windowEl.offsetWidth;
    const zone = 24;

    if (left <= zone) {
      Object.assign(windowEl.style, {
        left: '0px',
        top: '0px',
        width: `${Math.floor(this.layer.clientWidth / 2)}px`,
        height: `${this.layer.clientHeight}px`,
      });
      return;
    }

    if (rightEdge >= this.layer.clientWidth - zone) {
      const half = Math.floor(this.layer.clientWidth / 2);
      Object.assign(windowEl.style, {
        left: `${half}px`,
        top: '0px',
        width: `${half}px`,
        height: `${this.layer.clientHeight}px`,
      });
    }
  }
}
