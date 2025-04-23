import express, { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { DataSource } from 'typeorm';
import { RoleRouter } from './routes/RoleRouter';

export class Server {
  private readonly app: express.Application;

  constructor(
    private readonly port: string | number,
    private readonly roleRouter: RoleRouter,
    private readonly appDataSource: DataSource
  ) {
    this.app = express();

    this.initaliseMiddlewares();
    this.initaliseRoutes();
    this.initaliseErrorHandling();
  }

  private initaliseMiddlewares() {
    this.app.use(express.json());
  }

  private initaliseRoutes() {
    this.app.use('/api/roles', this.roleRouter.getRouter());
  }

  private initaliseErrorHandling() {
    this.app.get('*', (req: Request, res: Response) => {
      const requestedURL = `${req.protocol}://${req.get('host')}${
        req.originalUrl
      }`;
      res
        .status(StatusCodes.NOT_FOUND)
        .send('Route ' + requestedURL + ' not found.');
    });
  }

  public async start() {
    await this.initialiseDataSource();
    this.app.listen(this.port, () => {
      console.log(`Server running on http://localhost:${this.port}`);
    });
  }

  private async initialiseDataSource() {
    try {
      await this.appDataSource.initialize();
      console.log('Data source initalised');
    } catch (error) {
      console.log('Error during initialisation:', error);
      throw error;
    }
  }
}
