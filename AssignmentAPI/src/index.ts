import { RoleController } from './controllers/RoleController';
import { AppDataSource } from './data-source';
import { RoleRouter } from './routes/RoleRouter';
import { Server } from './server';
import { Router } from 'express';

const DEFAULT_PORT = 8900;
const port = process.env.SERVER_PORT || DEFAULT_PORT;

if (!process.env.SERVER_PORT) {
  console.log(
    'PORT environment variable is not set, defaulting to ' + DEFAULT_PORT
  );
}

const appDataSource = AppDataSource;

const roleRouter = new RoleRouter(Router(), new RoleController());

const server = new Server(port, roleRouter, appDataSource);
server.start();
