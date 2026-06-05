export function renderGridView(items) {
  return `
    <div class="files-grid">
      ${items
        .map(
          (item) => `
          <button type="button" class="file-card" data-path="${item.path}" data-type="${item.type}">
            <span class="file-card__icon">${item.type === 'dir' ? '📁' : '📄'}</span>
            <span class="file-card__name">${item.name}</span>
          </button>
        `,
        )
        .join('')}
    </div>
  `;
}
