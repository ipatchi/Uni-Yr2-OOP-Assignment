import { Response } from 'express';
import { Logger } from './Logger';
import { StatusCodes } from 'http-status-codes';

export class ResponseHandler {
  public static sendErrorResponse(
    res: Response,
    statusCode: number,
    message: string = 'Unexpected error occured'
  ): Response {
    const timestamp = new Date().toISOString();
    Logger.error(`[Error]:${message}`, `{timestamp}`);

    const errorResponse = {
      error: {
        message: message,
        status: statusCode,
        timestamp: timestamp,
      },
    };
    return res.status(statusCode).send(errorResponse);
  }

  public static sendSuccessResponse(
    res: Response,
    data: any,
    statusCode = StatusCodes.OK
  ): Response {
    const successResponse = {
      data: data,
    };
    return res.status(statusCode).send(successResponse);
  }
}
