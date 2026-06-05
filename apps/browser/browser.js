import { normalizeBrowserInput } from './proxyHandler.js';

export function createBrowserApp() {
  return {
    title: 'Browser',
    icon: 'globe',
    mount({ host }) {
      host.innerHTML = `
        <section class="browser-app">
          <div class="browser-toolbar">
            <button type="button" data-action="back">←</button>
            <button type="button" data-action="forward">→</button>
            <button type="button" data-action="refresh">⟳</button>
            <form class="browser-address-form">
              <input class="browser-address" type="url" placeholder="Enter URL or search" />
            </form>
          </div>
          <iframe class="browser-frame" referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
        </section>
      `;

      const frame = host.querySelector('.browser-frame');
      const form = host.querySelector('.browser-address-form');
      const input = host.querySelector('.browser-address');

      const history = [];
      let pointer = -1;

      const visit = (raw) => {
        const url = normalizeBrowserInput(raw);
        if (!url) return;

        if (history[pointer] !== url) {
          history.splice(pointer + 1);
          history.push(url);
          pointer = history.length - 1;
        }

        input.value = url;
        frame.src = url;
      };

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        visit(input.value);
      });

      host.querySelector('[data-action="back"]').addEventListener('click', () => {
        if (pointer <= 0) return;
        pointer -= 1;
        frame.src = history[pointer];
        input.value = history[pointer];
      });

      host.querySelector('[data-action="forward"]').addEventListener('click', () => {
        if (pointer >= history.length - 1) return;
        pointer += 1;
        frame.src = history[pointer];
        input.value = history[pointer];
      });

      host.querySelector('[data-action="refresh"]').addEventListener('click', () => {
        if (pointer < 0) return;
        frame.src = history[pointer];
      });

      visit('https://example.com');
    },
  };
}
