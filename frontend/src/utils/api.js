const BASE_URL = "/api";

export async function startResearch(query) {
  const res = await fetch(`${BASE_URL}/research`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to start research");
  }
  return res.json();
}

export function subscribeToJob(jobId, { onStep, onResult, onError, onDone }) {
  const es = new EventSource(`${BASE_URL}/research/${jobId}/stream`);

  es.addEventListener("step", (e) => {
    try { onStep?.(JSON.parse(e.data)); } catch {}
  });
  es.addEventListener("result", (e) => {
    try { onResult?.(JSON.parse(e.data)); } catch {}
  });
  es.addEventListener("error", (e) => {
    try { onError?.(JSON.parse(e.data)); } catch {}
    es.close();
  });
  es.addEventListener("done", () => {
    onDone?.();
    es.close();
  });

  es.onerror = () => {
    onError?.({ message: "Stream connection error" });
    es.close();
  };

  return () => es.close();
}

export async function uploadDocument(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/documents/upload`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Upload failed");
  }
  return res.json();
}

export async function ingestText(text, source) {
  const res = await fetch(`${BASE_URL}/documents/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, source }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Ingest failed");
  }
  return res.json();
}

export async function fetchStatus() {
  const res = await fetch(`${BASE_URL}/status`);
  return res.json();
}
