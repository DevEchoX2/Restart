import { createContextMenu } from '../../components/menu/contextMenu.js';
import { deleteNode, listDir, writeNode } from '../../core/fs.js';
import { renderGridView } from './templates/gridView.js';
import { renderListView } from './templates/listView.js';

function getUniqueFolderName(basePath) {
  const entries = listDir(basePath).map((item) => item.name.toLowerCase());
  let index = 1;
  let candidate = 'New Folder';
  while (entries.includes(candidate.toLowerCase())) {
    index += 1;
    candidate = `New Folder ${index}`;
  }
  return candidate;
}

export function createFilesApp() {
  return {
    title: 'Files',
    icon: 'folder-open',
    mount({ host, process }) {
      let currentPath = process.payload.path || '/';
      let mode = 'grid';

      host.innerHTML = `
        <section class="files-app">
          <header class="files-toolbar">
            <button type="button" data-action="up">Up</button>
            <button type="button" data-mode="grid">Grid</button>
            <button type="button" data-mode="list">List</button>
            <span class="files-path"></span>
          </header>
          <section class="files-content"></section>
        </section>
      `;

      const content = host.querySelector('.files-content');
      const pathEl = host.querySelector('.files-path');

      const render = () => {
        const items = listDir(currentPath);
        pathEl.textContent = currentPath;
        content.innerHTML = mode === 'grid' ? renderGridView(items) : renderListView(items);
      };

      const goUp = () => {
        if (currentPath === '/') return;
        const parts = currentPath.split('/').filter(Boolean);
        parts.pop();
        currentPath = `/${parts.join('/')}` || '/';
        render();
      };

      host.addEventListener('click', (event) => {
        const modeBtn = event.target.closest('button[data-mode]');
        if (modeBtn) {
          mode = modeBtn.dataset.mode;
          render();
          return;
        }

        const actionBtn = event.target.closest('button[data-action="up"]');
        if (actionBtn) {
          goUp();
          return;
        }

        const pathNode = event.target.closest('[data-path][data-type]');
        if (!pathNode) return;

        const path = pathNode.dataset.path;
        const type = pathNode.dataset.type;

        if (type === 'dir') {
          currentPath = path;
          render();
        }
      });

      createContextMenu({
        target: content,
        items: [
          {
            label: 'New Folder',
            onSelect: () => {
              const name = getUniqueFolderName(currentPath);
              writeNode(`${currentPath}/${name}`.replace('//', '/'), {
                type: 'dir',
                name,
                children: {},
              });
              render();
            },
          },
          {
            label: 'Delete Current Folder',
            onSelect: () => {
              if (currentPath === '/' || currentPath === '/Desktop') return;
              deleteNode(currentPath);
              goUp();
            },
          },
        ],
      });

      if (process.payload.createFolder && currentPath === '/Desktop') {
        const name = getUniqueFolderName('/Desktop');
        writeNode(`/Desktop/${name}`, {
          type: 'dir',
          name,
          children: {},
        });
      }

      render();
    },
  };
}
