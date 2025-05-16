import { Role } from '../entity/Role';
import { IAuthenticatedJWTRequest } from '../types/IAuthenticatedJWTRequest';
import express from 'express';
import { Logger } from './Logger';
import { ResponseHandler } from './ResponseHandler';
import { StatusCodes } from 'http-status-codes';
import { RoleName } from '../types/RoleName';

export const authoriseRole = (...approvedRoles: RoleName[]) => {
  return (
    req: IAuthenticatedJWTRequest,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const roleName = req.signedInUser?.role;
      if (!roleName) {
        const ERROR_MESSAGE = 'Missing essential information in JWT';
        Logger.error(ERROR_MESSAGE);
        return ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          ERROR_MESSAGE
        );
      }

      if (!approvedRoles.includes(roleName)) {
        const ERROR_MESSAGE = `User: ${req.signedInUser.email} attempted to access unauthorised route.`;
        Logger.error(ERROR_MESSAGE);
        return ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.FORBIDDEN,
          ERROR_MESSAGE
        );
      }
      return next();
    } catch {
      return ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        'Unknown error occured when authorising user role.'
      );
    }
  };
};
