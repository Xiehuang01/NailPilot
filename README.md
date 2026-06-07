# NailPilot | 甲选 AI

> From "try it on" to "book it now": an AI nail try-on and merchant decision system built for the Meituan Hackathon.

NailPilot is a full-stack hackathon demo that connects consumer-facing AI nail try-on with merchant-side data intelligence. Consumers can upload or capture a hand photo, pass AI quality checks, choose real merchant nail styles, generate AI try-on results, receive beauty-oriented scoring and recommendations, and book a simulated store visit. Merchants can see connected style analytics, try-on events, selection events, booking signals, user preferences, and OpenClaw-powered operation reports.

GitHub description:

```txt
AI-powered nail try-on and merchant analytics platform for the Meituan Hackathon, built with Vue 3, Express, MySQL, Qwen, Cats gptImage2, and OpenClaw.
```

## 中文说明

### 项目简介

NailPilot 是一个面向美团 Hackathon 的 AI 美甲试戴与商家经营决策 Demo。项目把用户端和商家端打通：用户端负责手图上传、手图质检、AI 试戴、美学复评、智能推荐和预约；商家端负责把用户真实产生的选款、试戴、评分、预约等行为沉淀成经营数据，并通过本地 OpenClaw 生成趋势日报、运营策略和小红书营销文案。

核心目标是展示一个完整闭环：

```txt
手图质检 -> 款式选择 -> AI 试戴生成 -> AI 审美复评 -> 智能推荐 -> 预约 -> 商家数据看板 -> OpenClaw 经营建议
```

### 功能亮点

- 用户端 AI 试戴：支持上传、拍照、测试手图选择，生成 1K WebP 试戴图。
- 手图质量审核：调用视觉模型判断是否为手部照片、手指是否张开、指甲是否清晰。
- 真实商品联通：用户端款式列表和商家端运营数据使用同一张 `styles` 表。
- AI 审美复评：生成后再次调用视觉模型，返回整体美观、肤色映衬、气质适配和总分。
- 智能推荐与预约：根据试戴效果和同店款式标签推荐更合适的款式，并模拟预约。
- 历史试戴：前端 `localStorage` 保存最近试戴记录，方便回看。
- 商家数据看板：聚合选款事件、试戴事件、预约数据、肤色偏好和热门款式。
- OpenClaw 商家 Agent：本地调用 OpenClaw 生成趋势日报、运营策略建议和小红书营销文案。

### 技术栈

Frontend:

- Vue 3
- Vite
- TypeScript
- Tailwind CSS v4
- Pinia
- Element Plus
- lucide-vue-next
- GSAP
- marked

Backend:

- Node.js
- Express
- TypeScript
- MySQL 8
- mysql2/promise
- sharp
- DashScope / Qwen
- Cats `gptImage2`
- OpenClaw CLI

### 项目结构

```txt
NailPilot/
├── front/                  # Vue 3 frontend
│   ├── src/pages/          # ConsumerPage, MerchantPage
│   ├── src/components/     # Chat, chart, UI components
│   ├── src/stores/         # Pinia stores
│   └── src/api/            # API client
├── back/                   # Express + TypeScript backend
│   ├── db/                 # schema.sql and seed.sql
│   ├── scripts/            # database init script
│   └── src/
│       ├── routes/         # API routes
│       ├── services/       # AI, agent, try-on, merchant services
│       ├── config/         # env and database config
│       └── middleware/     # error handling
└── README.md
```

### 本地启动

Requirements:

- Node.js 22+
- pnpm 10+
- MySQL 8+
- DashScope API key
- Cats API key
- OpenClaw CLI, required for merchant report generation

1. Install dependencies:

```bash
cd /Users/xie/Desktop/p/meituanHackathon/NailPilot/front
pnpm install

cd /Users/xie/Desktop/p/meituanHackathon/NailPilot/back
pnpm install
```

2. Configure environment files:

```bash
cd /Users/xie/Desktop/p/meituanHackathon/NailPilot/back
cp .env.example .env

cd /Users/xie/Desktop/p/meituanHackathon/NailPilot/front
cp .env.example .env
```

3. Initialize MySQL database:

```bash
cd /Users/xie/Desktop/p/meituanHackathon/NailPilot/back
pnpm db:init
```

4. Start backend:

```bash
cd /Users/xie/Desktop/p/meituanHackathon/NailPilot/back
pnpm dev
```

5. Start frontend:

```bash
cd /Users/xie/Desktop/p/meituanHackathon/NailPilot/front
pnpm dev
```

Default URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3003/api`

### 环境变量

Backend environment: `back/.env`

```env
PORT=3003
NODE_ENV=development

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=nailpilot

CORS_ORIGIN=http://localhost:3000,http://localhost:3002

CATS_API_BASE_URL=https://catsapi.com/api
CATS_API_KEY=your_cats_api_key
CATS_IMAGE_MODEL=gptImage2

DASHSCOPE_API_KEY=your_dashscope_api_key
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DASHSCOPE_IMAGE_ENDPOINT=https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
HAND_QUALITY_MODEL=qwen-vl-plus
TRY_ON_REVIEW_MODEL=qwen-vl-plus
QWEN_MODEL=qwen3.6-plus
QWEN_IMAGE_MODEL=wan2.7-image
AGENT_MAX_LOOPS=4

OPENCLAW_BIN=/Users/xie/Library/pnpm/openclaw
OPENCLAW_LOCAL=true
OPENCLAW_TIMEOUT_SECONDS=60
```

Frontend environment: `front/.env`

```env
VITE_API_BASE_URL=http://localhost:3003/api
```

### OpenClaw 配置

商家端的三个按钮会调用本机 OpenClaw：

- `生成本周趋势日报`
- `生成运营策略建议`
- `生成小红书营销文案`

确认 OpenClaw 路径：

```bash
which openclaw
```

如果能得到路径，例如 `/Users/xie/Library/pnpm/openclaw`，就把它写入 `back/.env`：

```env
OPENCLAW_BIN=/Users/xie/Library/pnpm/openclaw
OPENCLAW_LOCAL=true
OPENCLAW_TIMEOUT_SECONDS=60
```

### 数据库说明

`back/db/schema.sql` 定义核心表：

- `styles`: 商家款式库，用户端和商家端共用。
- `style_selection_events`: 用户选中款式事件，用于分析商品热度。
- `try_on_events`: 用户试戴事件，用于统计试戴量、评分、肤色偏好和推荐效果。
- `bookings`: 预约记录。
- `merchant_*`: 商家端看板、排行、偏好、趋势和建议数据。

`back/db/seed.sql` 会插入可演示的数据，包括真实款式图片 URL、选款事件、试戴事件、预约事件和商家运营数据。

### 常用命令

Frontend:

```bash
cd front
pnpm dev
pnpm lint
pnpm build
pnpm preview
```

Backend:

```bash
cd back
pnpm dev
pnpm typecheck
pnpm build
pnpm start
pnpm db:init
```

### 上线准备

- 确认 `front/.env` 的 `VITE_API_BASE_URL` 指向线上后端 API。
- 确认 `back/.env` 已配置生产数据库、CORS 域名和真实 API key。
- 不要提交真实 `.env`、API key、数据库密码或本地日志。
- 生产环境先执行 `cd back && pnpm build`，再用 `pnpm start` 启动编译后的服务。
- 前端执行 `cd front && pnpm build`，将 `front/dist` 部署到静态托管服务。
- MySQL 生产库需要先执行 `pnpm db:init` 或手动执行 `schema.sql` + 必要 seed。
- 商家端 OpenClaw 报告依赖服务器可访问 `OPENCLAW_BIN`，上线前需要确认 CLI、模型凭据和权限。

### 提交前检查

```bash
cd front && pnpm lint && pnpm build
cd ../back && pnpm typecheck && pnpm build
```

### 协作规范

- `main` 保持可演示、可构建。
- 前端主要入口：`front/src/pages/ConsumerPage.vue`、`front/src/pages/MerchantPage.vue`。
- 后端核心服务：`back/src/services/tryOnService.ts`、`back/src/services/qwenImageService.ts`、`back/src/services/tryOnReviewService.ts`、`back/src/services/merchantService.ts`。
- 数据库变更需要同步修改 `back/db/schema.sql` 和 `back/db/seed.sql`。
- 不提交 `node_modules/`、`dist/`、`.env`、日志和本地缓存。

## English

### Overview

NailPilot is an AI-powered nail try-on and merchant analytics demo for the Meituan Hackathon. It connects the consumer journey with the merchant dashboard: consumers upload a hand photo, pass AI quality checks, choose real merchant styles, generate AI try-on results, receive beauty-oriented review scores, get better style recommendations, and create a simulated booking. Merchants then see connected analytics from style selections, try-on events, review scores, bookings, user preferences, and OpenClaw-generated business reports.

The core loop:

```txt
Hand quality check -> Style selection -> AI try-on -> AI beauty review -> Smart recommendation -> Booking -> Merchant analytics -> OpenClaw reports
```

### Highlights

- Consumer AI try-on with uploaded, captured, or test hand images.
- Hand photo quality check powered by a vision model.
- Shared product catalog between consumer and merchant flows through `styles.id`.
- AI beauty review with overall beauty, skin-tone match, style fit, and total score.
- Smart recommendations and simulated booking flow.
- Local try-on history stored in `localStorage`.
- Merchant dashboard powered by real selection, try-on, and booking events.
- Local OpenClaw integration for weekly trend reports, operation strategies, and Xiaohongshu marketing copy.

### Tech Stack

Frontend:

- Vue 3
- Vite
- TypeScript
- Tailwind CSS v4
- Pinia
- Element Plus
- lucide-vue-next
- GSAP
- marked

Backend:

- Node.js
- Express
- TypeScript
- MySQL 8
- mysql2/promise
- sharp
- DashScope / Qwen
- Cats `gptImage2`
- OpenClaw CLI

### Quick Start

Requirements:

- Node.js 22+
- pnpm 10+
- MySQL 8+
- DashScope API key
- Cats API key
- OpenClaw CLI, required for merchant report generation

Install dependencies:

```bash
cd /Users/xie/Desktop/p/meituanHackathon/NailPilot/front
pnpm install

cd /Users/xie/Desktop/p/meituanHackathon/NailPilot/back
pnpm install
```

Create environment files:

```bash
cd /Users/xie/Desktop/p/meituanHackathon/NailPilot/back
cp .env.example .env

cd /Users/xie/Desktop/p/meituanHackathon/NailPilot/front
cp .env.example .env
```

Initialize the database:

```bash
cd /Users/xie/Desktop/p/meituanHackathon/NailPilot/back
pnpm db:init
```

Start the backend:

```bash
cd /Users/xie/Desktop/p/meituanHackathon/NailPilot/back
pnpm dev
```

Start the frontend:

```bash
cd /Users/xie/Desktop/p/meituanHackathon/NailPilot/front
pnpm dev
```

Default URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3003/api`

### Deployment Notes

- Set `VITE_API_BASE_URL` in `front/.env` to the deployed backend API.
- Set production database credentials, CORS origins, and API keys in `back/.env`.
- Never commit real `.env` files, API keys, database passwords, or local logs.
- Build backend with `cd back && pnpm build`, then run `pnpm start`.
- Build frontend with `cd front && pnpm build`, then deploy `front/dist`.
- Initialize MySQL with `pnpm db:init` or apply `schema.sql` and required seed data manually.
- OpenClaw merchant reports require `OPENCLAW_BIN` to be available on the deployment machine.

### API Surface

- `GET /api/health`
- `GET /api/styles`
- `POST /api/hand/analyze`
- `POST /api/try-on`
- `GET /api/recommendations`
- `POST /api/bookings`
- `POST /api/style-selections`
- `POST /api/consumer-agent/chat`
- `GET /api/merchant/dashboard`
- `GET /api/merchant/ranking`
- `GET /api/merchant/user-preferences`
- `GET /api/merchant/suggestions`
- `POST /api/merchant/reports`

### Validation

Run these checks before pushing:

```bash
cd front && pnpm lint && pnpm build
cd ../back && pnpm typecheck && pnpm build
```

