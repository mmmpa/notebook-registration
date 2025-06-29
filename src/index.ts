import { readFileSync } from "node:fs";
import { app } from "./server";

function startServer() {
  const port = Number(process.env.PORT) || 10001;
  const useHttps = process.env.HTTPS === "true";

  const tlsKeyPath = process.env.TLS_KEY_PATH || "./key.pem";
  const tlsCertPath = process.env.TLS_CERT_PATH || "./cert.pem";

  Bun.serve({
    port,
    fetch: app.fetch,
    ...(useHttps && {
      tls: {
        key: readFileSync(tlsKeyPath),
        cert: readFileSync(tlsCertPath),
      },
    }),
  });
  
  console.log(`Starting NotebookLM Registration Service on ${useHttps ? "HTTPS" : "HTTP"} port ${port}`);
}

// Start server only when this file is the entry point
if (import.meta.main) {
  startServer();
}
