export const osState = {
  workspaces: [1, 2, 3],
  activeWorkspace: 1,
  openProcesses: [],
  nextWindowId: 1,
  zIndexSeed: 200,
  focusedWindowId: null,
};

const listeners = new Set();

export function subscribeState(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitState() {
  for (const listener of listeners) {
    listener(osState);
  }
}

export function createProcess({ appId, title, icon = 'layout-grid', payload = {} }) {
  const id = `win-${osState.nextWindowId++}`;
  const process = {
    id,
    appId,
    title,
    icon,
    payload,
    minimized: false,
    maximized: false,
    workspace: osState.activeWorkspace,
    bounds: { x: 120, y: 90, width: 760, height: 500 },
    zIndex: ++osState.zIndexSeed,
  };

  osState.focusedWindowId = id;
  osState.openProcesses.push(process);
  emitState();
  return process;
}

export function updateProcess(id, patch) {
  const process = osState.openProcesses.find((item) => item.id === id);
  if (!process) return null;
  Object.assign(process, patch);
  emitState();
  return process;
}

export function removeProcess(id) {
  const index = osState.openProcesses.findIndex((item) => item.id === id);
  if (index < 0) return;
  osState.openProcesses.splice(index, 1);
  if (osState.focusedWindowId === id) {
    osState.focusedWindowId = osState.openProcesses.at(-1)?.id ?? null;
  }
  emitState();
}

export function focusProcess(id) {
  const process = osState.openProcesses.find((item) => item.id === id);
  if (!process) return;
  process.zIndex = ++osState.zIndexSeed;
  osState.focusedWindowId = id;
  emitState();
}

export function setActiveWorkspace(workspaceNumber) {
  if (!osState.workspaces.includes(workspaceNumber)) return;
  osState.activeWorkspace = workspaceNumber;
  emitState();
}
