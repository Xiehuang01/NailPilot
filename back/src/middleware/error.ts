import type { ErrorRequestHandler, Request, Response } from 'express';
import type { AppError } from '../types/http.js';

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler: ErrorRequestHandler = (error: AppError, _req, res, _next) => {
  console.error('[后端错误] 请求处理失败', {
    message: error.message ?? 'Internal server error',
    statusCode: error.statusCode ?? 500,
    time: new Date().toLocaleString('zh-CN', { hour12: false }),
  });

  res.status(error.statusCode ?? 500).json({
    message: error.message ?? 'Internal server error',
  });
};
