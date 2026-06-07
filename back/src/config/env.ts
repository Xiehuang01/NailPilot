import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: Number.parseInt(process.env.PORT ?? '3003', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  DB_HOST: process.env.DB_HOST ?? '127.0.0.1',
  DB_PORT: Number.parseInt(process.env.DB_PORT ?? '3306', 10),
  DB_USER: process.env.DB_USER ?? 'root',
  DB_PASSWORD: process.env.DB_PASSWORD ?? '',
  DB_NAME: process.env.DB_NAME ?? 'nailpilot',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:3000,http://localhost:3002',
  CATS_API_BASE_URL: process.env.CATS_API_BASE_URL ?? 'https://catsapi.com/api',
  CATS_API_KEY: process.env.CATS_API_KEY ?? '',
  CATS_IMAGE_MODEL: process.env.CATS_IMAGE_MODEL ?? 'gptImage2',
  DASHSCOPE_API_KEY: process.env.DASHSCOPE_API_KEY ?? '',
  DASHSCOPE_BASE_URL: process.env.DASHSCOPE_BASE_URL ?? 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  DASHSCOPE_IMAGE_ENDPOINT:
    process.env.DASHSCOPE_IMAGE_ENDPOINT ?? 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
  HAND_QUALITY_MODEL: process.env.HAND_QUALITY_MODEL ?? 'qwen-vl-plus',
  TRY_ON_REVIEW_MODEL: process.env.TRY_ON_REVIEW_MODEL ?? 'qwen-vl-plus',
  QWEN_MODEL: process.env.QWEN_MODEL ?? 'qwen3.6-plus',
  QWEN_IMAGE_MODEL: process.env.QWEN_IMAGE_MODEL ?? 'wan2.7-image',
  AGENT_MAX_LOOPS: Number.parseInt(process.env.AGENT_MAX_LOOPS ?? '4', 10),
};
