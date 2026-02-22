import { useEffect, useState } from "react";
import { api } from "./api/client";

export default function App() {
  const [status, setStatus] = useState("loading...");

  useEffect(() => {
    api.get("/health")
      .then((res) => setStatus(JSON.stringify(res.data)))
      .catch((err) => setStatus("ERROR: " + (err?.message || "unknown")));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Frontend is running</h1>
      <p>API /health response:</p>
      <pre>{status}</pre>
    </div>
  );
}