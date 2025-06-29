# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Bun-based web service that automates URL registration in Google NotebookLM using Playwright for browser automation. The service exposes a REST API built with Hono framework.

## Development Commands

```bash
# Install dependencies
bun install
npx playwright install

# Authentication setup (one-time)
bun run save-auth.ts

# Run the server
PLAYWRIGHT_AUTH_FILE=tmp/auth.json bun run src/index.ts

# HTTPS mode (required for bookmarklet use on HTTPS sites)
# Using Tailscale certificates
HTTPS=true \
TLS_KEY_PATH=./YOUR_DOMAIN.ts.net.key.pem \
TLS_CERT_PATH=./YOUR_DOMAIN.ts.net.cert.pem \
PLAYWRIGHT_AUTH_FILE=tmp/auth.json \
bun run src/index.ts

# Test the API endpoint (no server startup required)
./test.sh

# Code quality checks
bun run check          # Run all checks (lint + format)
bun run check:fix      # Auto-fix all issues
bun run typecheck      # TypeScript type checking
bun run lint           # Lint only
bun run format         # Format only
```

## Architecture

The application follows a clean, modular architecture with clear separation of concerns:

1. **src/index.ts**: Server entry point with HTTP/HTTPS configuration
   - Configures Bun.serve with conditional TLS support
   - Uses `import.meta.main` check to start server only when run directly
   - Environment variables:
     - `PORT` (default: 10001)
     - `HTTPS` (default: false)
     - `TLS_KEY_PATH` (default: ./key.pem)
     - `TLS_CERT_PATH` (default: ./cert.pem)

2. **src/server.ts**: HTTP server with Hono framework
   - CORS-enabled for bookmarklet support (allows all origins)
   - Three endpoints: POST `/register`, GET `/backup`, GET `/` (health check)
   - Automatic tmp/ directory creation for backup files

3. **src/use-case.ts**: Business logic and browser automation
   - Playwright automation targeting Japanese NotebookLM UI
   - Anti-detection measures for Google login workarounds
   - Tab-separated backup file format in `tmp/backup.txt`

4. **Key Dependencies**:
   - `hono` (v4.8.3): Lightweight web framework with CORS middleware
   - `playwright` (v1.53.1): Browser automation for NotebookLM interaction
   - `@biomejs/biome` (v2.0.6): Code linting and formatting

## Important Implementation Details

### NotebookLM Automation
The Playwright automation in src/use-case.ts contains selectors for the current NotebookLM UI:
- New notebook button selector: `button[aria-label="ノートブックを新規作成"]`
- Website chip selector: `mat-chip:has-text("ウェブサイト")`
- URL input field selector: `getByLabel("URL を貼り付け")`
- Insert button selector: `getByRole("button", { name: "挿入" })`

### Browser Configuration
- Defaults to `headless: true` for production use
- Set `PLAYWRIGHT_HEADLESS=false` to show browser for debugging
- Uses Chromium with anti-detection measures:
  - Custom user agent and viewport (1280x720)
  - Japanese locale (`ja-JP`) for NotebookLM interface
  - Removes automation indicators via `addInitScript`

### Authentication Strategy
- Persistent authentication via saved browser state in `tmp/auth.json`
- Manual login setup: `bun run save-auth.ts` (one-time)
- Authentication state automatically loaded if `PLAYWRIGHT_AUTH_FILE` is set
- Failed URLs are logged to `tmp/backup.txt` in tab-separated format

### HTTPS Support
- Uses Tailscale certificates for trusted HTTPS (no browser warnings)
- Environment variables:
  - `HTTPS=true` enables TLS mode
  - `TLS_KEY_PATH` specifies the key file path
  - `TLS_CERT_PATH` specifies the certificate file path
- To obtain Tailscale certificates: `tailscale cert YOUR_DOMAIN.ts.net`
- Tailscale certificates are automatically trusted by browsers

## API Endpoints

### POST /register
Registers a URL with NotebookLM.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "URL registered successfully",
  "url": "https://example.com"
}
```

**Error Response (500):**
```json
{
  "error": "Failed to register URL",
  "details": "Error message",
  "savedToBackup": true
}
```

### GET /backup
Returns list of failed URL registrations.

**Response:**
```json
{
  "count": 2,
  "entries": [
    {
      "timestamp": "2024-01-01T12:00:00.000Z",
      "url": "https://example.com",
      "error": "Error message"
    }
  ]
}
```

## Code Quality

The project uses Biome for linting and formatting with the following configuration:
- Double quotes for strings
- Semicolons required
- Trailing commas everywhere
- Node.js import protocol required (`node:` prefix)
- 2-space indentation

## TypeScript Configuration

The project uses strict TypeScript settings with Bun's module resolution. Key compiler options:
- Target: ESNext
- Module Resolution: bundler
- Strict mode enabled
- No emit (Bun handles transpilation)

## Bookmarklet Usage

The service includes bookmarklet support for easy URL registration from any webpage:

1. **Setup**: Create bookmark with JavaScript code that calls the `/register` endpoint
2. **CORS**: Server configured to allow all origins for bookmarklet compatibility
3. **HTTPS Required**: Must use HTTPS mode to avoid mixed content errors on secure sites
4. **Tailscale Certificate**: Uses trusted Tailscale certificates (no browser warnings)

**Note**: HTTP mode cannot be used from HTTPS sites due to browser mixed content security policies.