const BASE = import.meta.env.VITE_CONNECTOR_URL;

export async function syncUsers() {
  const res = await fetch(`${BASE}/sync/users`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error(`Failed to sync users: ${res.status}`);
  }

  return res.json();
}

export async function syncLogs() {
  const res = await fetch(`${BASE}/sync/logs`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error(`Failed to sync logs: ${res.status}`);
  }

  return res.json();
}
