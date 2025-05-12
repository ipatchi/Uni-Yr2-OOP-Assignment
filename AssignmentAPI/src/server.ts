import express, { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { DataSource } from 'typeorm';
import { LoginRouter } from './routes/LoginRouter';
import { UserRouter } from './routes/UserRouter';
import { RoleRouter } from './routes/RoleRouter';
import { ResponseHandler } from './helpers/ResponseHandler';
import { Logger } from './helpers/Logger';
import morgan, { StreamOptions } from 'morgan';
import jwt from 'jsonwebtoken';

export class Server {
  private readonly app: express.Application;

  public static readonly ERROR_TOKEN_IS_INVALID =
    'Not authorised - Token is invalid';
  public static readonly ERROR_TOKEN_NOT_FOUND =
    'Not authorised - Token not found';

  constructor(
    private readonly port: string | number,
    private readonly loginRouter: LoginRouter,
    private readonly roleRouter: RoleRouter,
    private readonly userRouter: UserRouter,
    private readonly appDataSource: DataSource
  ) {
    this.app = express();


    this.initaliseMiddlewares();

    this.initaliseRoutes();

    this.initaliseErrorHandling();
  }

  private initaliseMiddlewares() {
    const morganStream: StreamOptions = {
      write: (message: string): void => {
        Logger.info(message.trim());
      },
    };

    this.app.use(express.json());
    this.app.use(require('helmet')())
    this.app.use(morgan('combined', { stream: morganStream }));
  }

  private initaliseRoutes() {
    this.app.use('/api/login', this.loginRouter.getRouter());
    this.app.use(
      '/api/roles',
      this.authenticateToken,
      this.roleRouter.getRouter()
    );
    this.app.use(
      '/api/users',
      this.authenticateToken,
      this.userRouter.getRouter()
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
      await this.appDataSource.initialize();
      Logger.info(`Data Source Initialised`);
    } catch (error) {
      Logger.info('Error during initialisation:', error);
      throw error;
    }
  }

  private authenticateToken = (
    req: Request,
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
        (req as any).signedInUser = payload;
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
