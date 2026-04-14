import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { homedir } from 'os';

const CONFIG_FILE = 'transient.config.json';

function expandHome(p) {
  if (!p) return p;
  return p.replace(/^~/, homedir());
}

export function loadConfig() {
  const configPath = resolve(process.cwd(), CONFIG_FILE);
  if (!existsSync(configPath)) {
    // Return sensible defaults if no config file found
    return defaults();
  }
  const raw = JSON.parse(readFileSync(configPath, 'utf8'));
  return mergeDefaults(raw);
}

function defaults() {
  return {
    project: 'default',
    engines: { trace: true, recall: true, intelligence: true },
    trace: {
      receipt_store: expandHome('~/transient-audit/receipts'),
      state_dir: expandHome('~/transient-audit'),
    },
    recall: {
      endpoint: 'http://localhost:8090',
      subject: 'local-dev-user',
      tenant: 'public',
    },
    intelligence: {
      endpoint: 'http://localhost:3001',
    },
    dashboard: {
      port: 7474,
      open_browser: true,
    },
  };
}

function mergeDefaults(raw) {
  const d = defaults();
  return {
    project: raw.project || d.project,
    engines: { ...d.engines, ...(raw.engines || {}) },
    trace: {
      receipt_store: expandHome(raw.trace?.receipt_store || d.trace.receipt_store),
      state_dir: expandHome(raw.trace?.state_dir || d.trace.state_dir),
    },
    recall: { ...d.recall, ...(raw.recall || {}) },
    intelligence: { ...d.intelligence, ...(raw.intelligence || {}) },
    dashboard: { ...d.dashboard, ...(raw.dashboard || {}) },
  };
}
