export function createContextMenu({ target = document.body, items = [] }) {
  const menu = document.createElement('div');
  menu.className = 'context-menu hidden';
  menu.innerHTML = items
    .map((item, index) => `<button type="button" data-item="${index}">${item.label}</button>`)
    .join('');

  const close = () => menu.classList.add('hidden');

  menu.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-item]');
    if (!button) return;
    const item = items[Number(button.dataset.item)];
    item?.onSelect?.();
    close();
  });

  target.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    menu.style.left = `${event.clientX}px`;
    menu.style.top = `${event.clientY}px`;
    menu.classList.remove('hidden');
  });

  window.addEventListener('click', close);
  window.addEventListener('blur', close);

  document.body.append(menu);
  return { menu, close, destroy: () => menu.remove() };
}
