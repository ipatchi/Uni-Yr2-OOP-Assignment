import { RoleController } from './controllers/RoleController';
import { AppDataSource } from './data-source';
import { RoleRouter } from './routes/RoleRouter';
import { UserRouter } from './routes/UserRouter';
import { LoginRouter } from './routes/LoginRouter';
import { UserController } from './controllers/UserController';
import { Server } from './server';
import { Router } from 'express';
import { LoginController } from './controllers/LoginController';
import { ManagerController } from './controllers/ManagerController';
import { ManagerRouter } from './routes/ManagerRouter';
import { LeaveRequestRouter } from './routes/LeaveRequestRouter';
import { LeaveRequestController } from './controllers/LeaveRequestController';

const DEFAULT_PORT = 8900;
const port = process.env.SERVER_PORT || DEFAULT_PORT;

if (!process.env.SERVER_PORT) {
  console.log(
    'PORT environment variable is not set, defaulting to ' + DEFAULT_PORT
  );
}

const appDataSource = AppDataSource;

const roleRouter = new RoleRouter(Router(), new RoleController());
const userRouter = new UserRouter(Router(), new UserController());
const loginRouter = new LoginRouter(Router(), new LoginController());
const managerRouter = new ManagerRouter(Router(), new ManagerController());
const leaveRequestRouter = new LeaveRequestRouter(Router(), new LeaveRequestController())

const server = new Server(
  port,
  loginRouter,
  roleRouter,
  userRouter,
  managerRouter,
  leaveRequestRouter,
  appDataSource
);

server.start();
