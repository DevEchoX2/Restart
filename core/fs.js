const STORAGE_KEY = 'restart.vfs.tree';

const defaultTree = {
  type: 'dir',
  name: '/',
  children: {
    Desktop: {
      type: 'dir',
      name: 'Desktop',
      children: {
        Settings: { type: 'app', name: 'Settings', appId: 'settings' },
        Browser: { type: 'app', name: 'Browser', appId: 'browser' },
        Files: { type: 'app', name: 'Files', appId: 'files' },
        Games: { type: 'app', name: 'Games', appId: 'games' },
      },
    },
    Documents: { type: 'dir', name: 'Documents', children: {} },
    Downloads: { type: 'dir', name: 'Downloads', children: {} },
    System: {
      type: 'dir',
      name: 'System',
      children: {
        Config: {
          type: 'dir',
          name: 'Config',
          children: {
            'settings.json': {
              type: 'file',
              name: 'settings.json',
              content: JSON.stringify({
                theme: 'theme-dark-glass',
                desktopScale: 1,
                taskbarStyle: 'default',
              }, null, 2),
            },
          },
        },
      },
    },
  },
};

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function normalize(path) {
  if (!path || path === '/') return '/';
  return `/${path}`.replace(/\/+/g, '/').replace(/\/\/$/, '') || '/';
}

function getSegments(path) {
  return normalize(path)
    .split('/')
    .filter(Boolean);
}

export function loadFS() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = clone(defaultTree);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  try {
    return JSON.parse(raw);
  } catch {
    const seed = clone(defaultTree);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

export function saveFS(tree) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
}

export function resetFS() {
  saveFS(clone(defaultTree));
  return loadFS();
}

export function getNode(path = '/') {
  const tree = loadFS();
  const segments = getSegments(path);
  let cursor = tree;

  for (const segment of segments) {
    if (!cursor?.children?.[segment]) return null;
    cursor = cursor.children[segment];
  }

  return cursor;
}

export function listDir(path = '/') {
  const node = getNode(path);
  if (!node || node.type !== 'dir') return [];

  return Object.entries(node.children || {}).map(([key, value]) => ({
    key,
    ...value,
    path: `${normalize(path)}/${key}`.replace('//', '/'),
  }));
}

export function writeNode(path, node) {
  const tree = loadFS();
  const segments = getSegments(path);
  const name = segments.pop();
  let cursor = tree;

  for (const segment of segments) {
    cursor.children ||= {};
    cursor.children[segment] ||= { type: 'dir', name: segment, children: {} };
    cursor = cursor.children[segment];
  }

  if (!name) return false;
  cursor.children ||= {};
  cursor.children[name] = node;
  saveFS(tree);
  return true;
}

export function deleteNode(path) {
  const tree = loadFS();
  const segments = getSegments(path);
  const name = segments.pop();
  let cursor = tree;

  for (const segment of segments) {
    if (!cursor?.children?.[segment]) return false;
    cursor = cursor.children[segment];
  }

  if (!name || !cursor?.children?.[name]) return false;
  delete cursor.children[name];
  saveFS(tree);
  return true;
}
