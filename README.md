# ScamShield

A no-dependency local website with browser-based warning-sign checks and optional Gemini explanations and chat.

## Run locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` to a key from Google AI Studio. Keep `.env` private; it is ignored by Git.
3. Run `npm start` in this folder.
4. Open <http://127.0.0.1:4173>.

The basic message and link checks work without an API key. Gemini explanations and chat need a working API key and may incur API usage charges. AI requests send submitted messages and/or URLs to Google's Gemini API. The server does not save prompts or responses, and the chat history stays in browser memory for the current page session. The AI does not visit URLs or check a live threat database. The scam report form creates a copyable summary on your device; it does not submit or save reports.

## Deploy on Netlify

1. Import `sunnyy2006-prog/scamsheild` from GitHub in Netlify.
2. Use the repository root as the base directory. `netlify.toml` configures the build and functions.
3. In the Netlify site settings, add `GEMINI_API_KEY` as a private environment variable with Functions scope. Do not put the value in `netlify.toml` or commit it.
4. Deploy the `main` branch. Netlify builds the static site and the three Gemini API functions.

`GEMINI_MODEL` is optional; if omitted, the functions use `gemini-3.1-flash-lite`. AI requests send submitted messages and/or links to Google's Gemini API. The report summary remains on the visitor's device.

For a public deployment, configure the key as a private server environment variable, use HTTPS, and add hosting-level abuse protection/rate limits. The included in-memory limit is intended only as a small local safeguard. The default server binds to `127.0.0.1` for local use and is not a public deployment configuration.
