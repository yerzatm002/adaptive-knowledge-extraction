import { api } from "./client";

export async function fetchHealth() {
  const res = await api.get("/health");
  return res.data;
}

export async function uploadDataset(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post("/datasets/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function fetchRules({ dataset, source, limit }) {
  const res = await api.post("/rules", {
    dataset: dataset || null,
    source: source || null,
    limit: limit ?? 50,
  });
  return res.data;
}

export async function predict({ dataset, features }) {
  const res = await api.post("/predict", { dataset, features });
  return res.data;
}

export async function fetchMetrics({ dataset, limit }) {
  const params = new URLSearchParams();
  if (dataset) params.set("dataset", dataset);
  if (limit) params.set("limit", String(limit));
  const res = await api.get(`/metrics?${params.toString()}`);
  return res.data;
}