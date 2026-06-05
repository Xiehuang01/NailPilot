# NailPilot Backend

`back/` contains the Node.js + Express + MySQL backend for NailPilot.

## Stack

- Node.js
- TypeScript
- Express
- MySQL
- `mysql2/promise`
- `tsx`
- `pnpm`

## Quick start

1. Install dependencies:
   `pnpm install`
2. Copy environment variables:
   `cp .env.example .env`
3. Create the database and seed demo data:
   `pnpm db:init`
4. Start the API server:
   `pnpm dev`

## Scripts

- `pnpm dev`: run the TypeScript backend in watch mode with `tsx`
- `pnpm typecheck`: run TypeScript checks without emitting files
- `pnpm build`: compile TypeScript into `dist/`
- `pnpm start`: run the compiled server from `dist/src/server.js`
- `pnpm db:init`: initialize MySQL schema and seed demo data

## Qwen Consumer Agent

The consumer AI assistant uses Alibaba Cloud Model Studio / DashScope OpenAI-compatible chat completions.

Add these values to `.env`:

```env
DASHSCOPE_API_KEY=your_dashscope_api_key
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen3.6-plus
QWEN_IMAGE_MODEL=qwen-image-2.0
DASHSCOPE_IMAGE_ENDPOINT=https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
AGENT_MAX_LOOPS=4
```

If `DASHSCOPE_API_KEY` is not configured, `/api/consumer-agent/chat` returns a local fallback response so the demo can still run.

`POST /api/try-on` also uses `qwen-image-2.0` when `DASHSCOPE_API_KEY` is configured. It sends the selected merchant nail style image plus the uploaded hand image, and asks the model to preserve hand skin texture, pose, lighting, shape, and photographic realism while generating the worn nail effect.

Default API base URL:

- `http://localhost:3003/api`

## Routes

- `GET /api/health`
- `POST /api/consumer-agent/chat`
- `GET /api/styles`
- `POST /api/hand/analyze`
- `POST /api/try-on`
- `GET /api/recommendations`
- `POST /api/bookings`
- `GET /api/merchant/dashboard`
- `POST /api/merchant/reports`
