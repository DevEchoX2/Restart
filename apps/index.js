import { createSettingsApp } from './settings/settings.js';
import { createBrowserApp } from './browser/browser.js';
import { createFilesApp } from './files/files.js';
import { createGamesApp } from './games/games.js';

export async function getAppRegistry() {
  return {
    settings: createSettingsApp(),
    browser: createBrowserApp(),
    files: createFilesApp(),
    games: await createGamesApp(),
  };
}
