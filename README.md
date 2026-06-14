# HIVE Mass Data Storage

Full-stack Vite + React + Express app with Drizzle ORM and PostgreSQL.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set environment variables in `.env` or your terminal:
   - `DATABASE_URL` or `SUPABASE_DATABASE_URL`
   - `SESSION_SECRET`
   - `OPENAI_API_KEY` (optional for Greo chat)
3. Run development mode:
   ```bash
   npm run dev
   ```

## Project structure

- `server/` - Express backend
- `src/` - React frontend
- `src/components/` - UI components
- `src/lib/api.ts` - browser API client
- `server/schema.ts` - Drizzle ORM schema

## Build

```bash
npm run build
```

## Start

```bash
npm start
```
