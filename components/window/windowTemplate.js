function escapeHTML(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function createWindowMarkup(process) {
  const { id, title, zIndex, bounds } = process;
  const safeTitle = escapeHTML(title);

  return `
    <article
      class="window"
      data-window-id="${id}"
      style="left:${bounds.x}px;top:${bounds.y}px;width:${bounds.width}px;height:${bounds.height}px;z-index:${zIndex};"
    >
      <header class="window-header" role="banner">
        <span class="window-title">${safeTitle}</span>
        <div class="window-controls">
          <button type="button" class="window-control" data-action="minimize" aria-label="Minimize">—</button>
          <button type="button" class="window-control" data-action="maximize" aria-label="Maximize">□</button>
          <button type="button" class="window-control close" data-action="close" aria-label="Close">✕</button>
        </div>
      </header>
      <section class="window-content" data-window-content="${id}"></section>
      <span class="resize-handle right" data-resize="right"></span>
      <span class="resize-handle bottom" data-resize="bottom"></span>
      <span class="resize-handle corner" data-resize="corner"></span>
    </article>
  `.trim();
}
