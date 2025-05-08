import express, { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { DataSource } from 'typeorm';
import { RoleRouter } from './routes/RoleRouter';
import { ResponseHandler } from './helpers/ResponseHandler';
import { Logger } from './helpers/Logger';
import { UserRouter } from './routes/UserRouter';
import morgan, { StreamOptions } from 'morgan';

export class Server {
  private readonly app: express.Application;

  constructor(
    private readonly port: string | number,
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
    this.app.use(morgan('combined', { stream: morganStream }));
  }

  private initaliseRoutes() {
    this.app.use('/api/roles', this.roleRouter.getRouter());
    this.app.use('/api/users', this.userRouter.getRouter());
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
}
