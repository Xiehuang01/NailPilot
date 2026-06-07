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

## AI Services

The consumer AI assistant uses Alibaba Cloud Model Studio / DashScope OpenAI-compatible chat completions. The nail try-on image pipeline uses Cats `gptImage2`.

Add these values to `.env`:

```env
CATS_API_BASE_URL=https://catsapi.com/api
CATS_API_KEY=your_cats_api_key
CATS_IMAGE_MODEL=gptImage2

DASHSCOPE_API_KEY=your_dashscope_api_key
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
HAND_QUALITY_MODEL=qwen-vl-plus
TRY_ON_REVIEW_MODEL=qwen-vl-plus
QWEN_MODEL=qwen3.6-plus
DASHSCOPE_IMAGE_ENDPOINT=https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
AGENT_MAX_LOOPS=4
```

If `DASHSCOPE_API_KEY` is not configured, `/api/consumer-agent/chat` returns a local fallback response so the demo can still run.

`POST /api/hand/analyze` uses `HAND_QUALITY_MODEL` to check whether the uploaded hand photo has spread fingers and visible fingertips before the try-on flow continues.

`POST /api/try-on` uses Cats `gptImage2` when `CATS_API_KEY` is configured. It directly composes the selected merchant style image onto the uploaded hand photo, then calls `TRY_ON_REVIEW_MODEL` for a second visual pass that returns JSON scores for fit, brightening, style match, total score, and alternative style recommendations.

Each try-on request is also recorded into `try_on_events`, so the merchant dashboard can aggregate real try-on counts, skin tone distribution, top-performing styles, and seven-day try-on trends.

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
