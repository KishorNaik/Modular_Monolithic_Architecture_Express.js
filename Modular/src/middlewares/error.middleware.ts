import { NextFunction, Request, Response } from 'express';
import { logger } from '@/shared/utils/logger';
import { DataResponse } from '@/shared/models/response/data.Response';
import { HttpException } from '@/shared/utils/httpException';

export const ErrorMiddleware = (error: HttpException, req: Request, res: Response, next: NextFunction) => {
  try {
    const status: number = error.status || 500;
    const message: string = error.message || 'Something went wrong';

    logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}`);

    const errorResponse: DataResponse<undefined> = {
      Success: false,
      StatusCode: status,
      Data: undefined,
      Message: message,
    };

    res.status(status).json(errorResponse);
  } catch (error) {
    next(error);
  }
};
