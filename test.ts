import { app } from "./src/server";

// Test the NotebookLM registration endpoint
const testRequest = new Request("http://localhost/register", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    url: "https://example.com",
  }),
});

const response = await app.fetch(testRequest);
const result = await response.json();

console.log("Status:", response.status);
console.log("Response:", result);
