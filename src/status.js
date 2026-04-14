import { existsSync, readdirSync } from 'fs';

export async function getStatus(config) {
  const results = {
    trace: await checkTrace(config),
    recall: await checkRecall(config),
    intelligence: await checkIntelligence(config),
  };
  return results;
}

async function checkTrace(config) {
  const store = config.trace.receipt_store;
  if (!existsSync(store)) {
    return { active: false, reason: `receipt store not found at ${store}` };
  }
  const files = readdirSync(store).filter(f => f.endsWith('.json'));
  return { active: true, receipts: files.length };
}

async function checkRecall(config) {
  if (!config.engines.recall) return { active: false, reason: 'disabled in config' };
  try {
    const res = await fetch(`${config.recall.endpoint}/healthz`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      return { active: true, nodes: data?.system?.graph?.nodes_count };
    }
    return { active: false, reason: `healthz returned ${res.status}` };
  } catch {
    return { active: false, reason: 'not reachable — is Docker running?' };
  }
}

async function checkIntelligence(config) {
  if (!config.engines.intelligence) return { active: false, reason: 'disabled in config' };
  try {
    const res = await fetch(`${config.intelligence.endpoint}/healthz`, {
      signal: AbortSignal.timeout(3000),
    });
    return { active: res.ok, reason: res.ok ? null : `healthz returned ${res.status}` };
  } catch {
    return { active: false, reason: 'not reachable' };
  }
}

export function printStatus(status) {
  console.log('\nTransient status\n');
  for (const [engine, s] of Object.entries(status)) {
    const icon = s.active ? '✓' : '✗';
    const detail = s.active
      ? (s.receipts != null ? `${s.receipts} receipts` : s.nodes != null ? `${s.nodes} graph nodes` : 'ok')
      : s.reason;
    console.log(`  ${icon} ${engine.padEnd(14)} ${detail}`);
  }
  console.log('');
}
