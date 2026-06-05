export type AppError = Error & {
  code?: string;
  detail?: string;
  statusCode?: number;
};

export const createAppError = (message: string, statusCode?: number, extras: Omit<AppError, keyof Error | 'statusCode'> = {}) => {
  const error = new Error(message) as AppError;
  if (statusCode) {
    error.statusCode = statusCode;
  }

  Object.assign(error, extras);
  return error;
};
