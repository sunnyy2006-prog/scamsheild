# ScamShield

A no-dependency local website with browser-based warning-sign checks and optional AI explanations and chat.

## Run locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` and set `OPENAI_API_KEY` to an API key from your OpenAI API project. Keep `.env` private; it is ignored by Git.
3. Run `npm start` in this folder.
4. Open <http://127.0.0.1:4173>.

The basic message and link checks work without an API key. AI explanations and chat need a working API key and may incur API usage charges. AI requests send submitted messages and/or URLs to OpenAI. The server does not save prompts or responses, and the chat history stays in browser memory for the current page session. The AI does not visit URLs or check a live threat database.

For a public deployment, configure the key as a private server environment variable, use HTTPS, and add hosting-level abuse protection/rate limits. The included in-memory limit is intended only as a small local safeguard.
