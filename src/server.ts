import { mkdir } from "node:fs/promises";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getFailedUrls, registerUrlToNotebookLM, saveFailedUrl } from "./use-case";

const app = new Hono();

// Add CORS middleware for bookmarklet support
app.use("/*", cors({
  origin: "*",
  allowMethods: ["POST", "GET"],
  allowHeaders: ["Content-Type"],
}));

// Create tmp directory if it doesn't exist
await mkdir("./tmp", { recursive: true }).catch(() => {});

app.post("/register", async (c) => {
  const body = await c.req.json();
  const { url } = body;

  if (!url) {
    return c.json({ error: "URL is required" }, 400);
  }

  try {
    // Use the extracted function
    await registerUrlToNotebookLM(url);

    return c.json({
      success: true,
      message: "URL registered successfully",
      url: url,
    });
  } catch (error) {
    console.error("Error registering URL:", error);

    // Save failed URL to backup file
    const savedToBackup = await saveFailedUrl(url, error)
      .then(() => {
        console.log(`Failed URL saved to backup: ${url}`);
        return true;
      })
      .catch((backupError) => {
        console.error("Failed to save to backup file:", backupError);
        return false;
      });

    return c.json(
      {
        error: "Failed to register URL",
        details: error instanceof Error ? error.message : "Unknown error",
        savedToBackup,
      },
      500,
    );
  }
});

app.get("/", (c) => {
  return c.text("NotebookLM Registration Service");
});

app.get("/backup", async (c) => {
  try {
    const result = await getFailedUrls();
    return c.json(result);
  } catch (_error) {
    return c.json({ error: "Failed to read backup file" }, 500);
  }
});

export { app };
