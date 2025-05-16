import express, { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { DataSource } from 'typeorm';
import { LoginRouter } from './routes/LoginRouter';
import { UserRouter } from './routes/UserRouter';
import { RoleRouter } from './routes/RoleRouter';
import { ResponseHandler } from './helpers/ResponseHandler';
import { Logger } from './helpers/Logger';
import rateLimit from 'express-rate-limit';
import morgan, { StreamOptions } from 'morgan';
import jwt from 'jsonwebtoken';
import { IAuthenticatedJWTRequest } from './types/IAuthenticatedJWTRequest';
import { ManagerRouter } from './routes/ManagerRouter';
import { LeaveRequestRouter } from './routes/LeaveRequestRouter';

export class Server {
  private readonly app: express.Application;

  public static readonly ERROR_TOKEN_IS_INVALID =
    'Not authorised - Token is invalid';
  public static readonly ERROR_TOKEN_NOT_FOUND =
    'Not authorised - Token not found';

  private readonly loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests - try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });

  constructor(
    private readonly port: string | number,
    private readonly loginRouter: LoginRouter,
    private readonly roleRouter: RoleRouter,
    private readonly userRouter: UserRouter,
    private readonly managerRouter: ManagerRouter,
    private readonly leaveRequestRouter: LeaveRequestRouter,
    private readonly appDataSource: DataSource
  ) {
    this.app = express();

    this.initaliseMiddlewares();

    this.initaliseRoutes();

    this.initaliseErrorHandling();
  }

  private logRouteAccess(route: string) {
    return (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      Logger.info(`${route} accessed by ${req.ip}`);
      next();
    };
  }

  private readonly jwtRateLimiter = (userEmail: string) =>
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      message: 'Too many requests - try again later',
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => userEmail,
    });

  private jwtRateLimitMiddleware(route: string) {
    return (
      req: IAuthenticatedJWTRequest,
      res: express.Response,
      next: express.NextFunction
    ) => {
      const email = req.signedInUser?.email;
      if (email) {
        Logger.info(`${route} accessed by ${req.ip}`);
        this.jwtRateLimiter(email)(req, res, next);
      } else {
        const ERROR_MESSAGE = 'Missing essential information in JWT';
        Logger.error(ERROR_MESSAGE);
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          ERROR_MESSAGE
        );
      }
    };
  }

  private initaliseMiddlewares() {
    const morganStream: StreamOptions = {
      write: (message: string): void => {
        Logger.info(message.trim());
      },
    };

    this.app.use(express.json());
    this.app.use(require('helmet')());
    this.app.use(morgan('combined', { stream: morganStream }));
  }

  private initaliseRoutes() {
    this.app.use(
      '/api/login',
      this.loginLimiter,
      this.logRouteAccess('Login route'),
      this.loginRouter.getRouter()
    );
    this.app.use(
      '/api/roles',
      this.authenticateToken,
      this.logRouteAccess('Roles route'),
      this.jwtRateLimitMiddleware('roles'),
      this.roleRouter.getRouter()
    );
    this.app.use(
      '/api/users',
      this.authenticateToken,
      this.logRouteAccess('Users route'),
      this.jwtRateLimitMiddleware('users'),
      this.userRouter.getRouter()
    );
    this.app.use(
      '/api/managers',
      this.authenticateToken,
      this.logRouteAccess('Managers route'),
      this.jwtRateLimitMiddleware('managers'),
      this.managerRouter.getRouter()
    );
    this.app.use(
      '/api/leave-requests',
      this.authenticateToken,
      this.logRouteAccess('Leave requests route'),
      this.jwtRateLimitMiddleware('requests'),
      this.leaveRequestRouter.getRouter()
    );
  }

  private initaliseErrorHandling() {
    this.app.get('*splat', (req: Request, res: Response) => {
      const requestedURL = `${req.protocol}://${req.get('host')}${
        req.originalUrl
      }`;
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        'Route ' + requestedURL + ' not found.'
      );
    });
  }

  public async start() {
    await this.initialiseDataSource();
    this.app.listen(this.port, () => {
      Logger.info(`Server running on http://localhost:${this.port}`);
    });
  }

  private async initialiseDataSource() {
    try {
      Logger.info(`Data Source Initialised`);
      await this.appDataSource.initialize();
    } catch (error) {
      Logger.info('Error during initialisation:', error);
      throw error;
    }
  }

  private authenticateToken = (
    req: IAuthenticatedJWTRequest,
    res: Response,
    next: NextFunction
  ) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const tokenRecieved = authHeader.split(' ')[1];
      if (!process.env.JWT_SECRET) {
        Logger.error(Server.ERROR_TOKEN_NOT_FOUND);
        throw new Error(Server.ERROR_TOKEN_NOT_FOUND);
      }

      jwt.verify(tokenRecieved, process.env.JWT_SECRET, (err, payload) => {
        if (err) {
          Logger.error(Server.ERROR_TOKEN_IS_INVALID);
          return ResponseHandler.sendErrorResponse(
            res,
            StatusCodes.UNAUTHORIZED,
            Server.ERROR_TOKEN_IS_INVALID
          );
        }
        const {
          token: { email, role },
        } = payload as any;
        if (!email || !role) {
          return ResponseHandler.sendErrorResponse(
            res,
            StatusCodes.UNAUTHORIZED,
            Server.ERROR_TOKEN_IS_INVALID
          );
        }
        req.signedInUser = { email, role };
        next();
      });
    } else {
      Logger.error(Server.ERROR_TOKEN_NOT_FOUND);
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        Server.ERROR_TOKEN_NOT_FOUND
      );
    }
  };
}
