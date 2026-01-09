const BASE = import.meta.env.VITE_CONNECTOR_URL as string;

function ensureBase() {
  if (!BASE) throw new Error("VITE_CONNECTOR_URL is not set");
}

export async function connectorStatus() {
  ensureBase();
  const res = await fetch(`${BASE}/status`, { method: "GET" });
  if (!res.ok) throw new Error(`Status HTTP ${res.status}`);
  return res.json();
}

export async function syncUsersFromDevice() {
  ensureBase();
  const res = await fetch(`${BASE}/sync/users`, { method: "POST" });
  if (!res.ok) throw new Error(`Users HTTP ${res.status}`);
  return res.json(); // { ok, count, users }
}

export async function syncLogsFromDevice() {
  ensureBase();
  const res = await fetch(`${BASE}/sync/logs`, { method: "POST" });
  if (!res.ok) throw new Error(`Logs HTTP ${res.status}`);
  return res.json(); // { ok, count, logs }
}
