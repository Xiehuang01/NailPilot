# NailPilot

NailPilot is a Meituan Hackathon demo for AI-assisted nail try-on and merchant decision support.

The project is split into two apps:

- `front/`: Vue 3 + Vite + TypeScript frontend
- `back/`: Node.js + Express + TypeScript + MySQL backend

## Requirements

- Node.js 22+
- pnpm 10+
- MySQL 8+
- Alibaba Cloud DashScope API key, optional for local fallback but required for Qwen chat/image generation

## Local Setup

1. Install frontend dependencies:
   `cd front && pnpm install`
2. Install backend dependencies:
   `cd ../back && pnpm install`
3. Configure backend environment:
   `cp .env.example .env`
4. Configure frontend environment:
   `cd ../front && cp .env.example .env`
5. Initialize the database:
   `cd ../back && pnpm db:init`
6. Start the backend:
   `pnpm dev`
7. In another terminal, start the frontend:
   `cd ../front && pnpm dev`

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3003/api`

## Environment

Backend environment lives in `back/.env`. Do not commit real secrets.

Important backend variables:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `CORS_ORIGIN`
- `DASHSCOPE_API_KEY`
- `QWEN_MODEL`
- `QWEN_IMAGE_MODEL`

Frontend environment lives in `front/.env`.

Important frontend variables:

- `VITE_API_BASE_URL`

## Useful Commands

Frontend:

- `cd front && pnpm dev`
- `cd front && pnpm lint`
- `cd front && pnpm build`

Backend:

- `cd back && pnpm dev`
- `cd back && pnpm typecheck`
- `cd back && pnpm build`
- `cd back && pnpm db:init`

## Collaboration Notes

- Keep real `.env` files local only.
- Run `pnpm lint` in `front/` and `pnpm typecheck` in `back/` before pushing.
- Commit source, SQL, config examples, and docs.
- Do not commit `node_modules/`, `dist/`, logs, or local environment files.

## Project Map

- `front/src/pages/ConsumerPage.vue`: consumer try-on flow
- `front/src/components/ConsumerChat.vue`: consumer AI chat
- `front/src/pages/MerchantPage.vue`: merchant dashboard
- `back/src/services/consumerAgent/`: consumer agent, skills, memory, tool calling
- `back/src/services/qwenImageService.ts`: Qwen image generation integration
- `back/db/schema.sql`: MySQL schema
- `back/db/seed.sql`: demo seed data
