async function loadCatalog() {
  const url = new URL('./catalog.json', import.meta.url);
  const response = await fetch(url);
  return response.json();
}

export async function createGamesApp() {
  const catalog = await loadCatalog();

  return {
    title: 'Games',
    icon: 'gamepad-2',
    mount({ host }) {
      host.innerHTML = `
        <section class="games-app">
          <div class="games-grid">
            ${catalog
              .map(
                (game) => `
                <article class="game-card" data-url="${game.url}">
                  <h4>${game.title}</h4>
                  <p>${game.description}</p>
                  <button type="button">Play</button>
                </article>
              `,
              )
              .join('')}
          </div>
          <iframe class="games-frame" title="Game frame" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
        </section>
      `;

      const frame = host.querySelector('.games-frame');
      host.addEventListener('click', (event) => {
        const card = event.target.closest('.game-card');
        if (!card) return;
        frame.src = card.dataset.url;
      });
    },
  };
}
