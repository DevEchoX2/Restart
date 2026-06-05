export function renderListView(items) {
  return `
    <table class="files-list">
      <thead>
        <tr><th>Name</th><th>Type</th><th>Path</th></tr>
      </thead>
      <tbody>
        ${items
          .map(
            (item) => `
              <tr data-path="${item.path}" data-type="${item.type}">
                <td>${item.name}</td>
                <td>${item.type}</td>
                <td>${item.path}</td>
              </tr>
            `,
          )
          .join('')}
      </tbody>
    </table>
  `;
}
