import request from 'supertest';
import express, { Router } from 'express';
import { LoginRouter } from './LoginRouter';
import { LoginController } from '../controllers/LoginController';
import { StatusCodes } from 'http-status-codes';
import { toNamespacedPath } from 'path';

const mockLoginController = {
  login: jest.fn((req, res) => res.status(StatusCodes.OK).json(req.body)),
} as unknown as LoginController;

const router = Router();
jest.spyOn(router, 'get');
jest.spyOn(router, 'post');
jest.spyOn(router, 'patch');
jest.spyOn(router, 'delete');
jest.spyOn(router, 'use');

const app = express();
app.use(express.json());

const loginRouter = new LoginRouter(router, mockLoginController);
app.use('/login', loginRouter.getRouter());

const BASE_ROLES_URL = '/login';

describe('LoginRouter tests', () => {
  it('login on POST /login can be called', async () => {
    const loginData = {
      email: 'user@email.com',
      password: 'password1234',
    };
    const response = await request(app)
      .post(BASE_ROLES_URL)
      .send(loginData)
      .expect(StatusCodes.OK);

    let body = (mockLoginController.login as jest.Mock).mock.calls[0][0].body;

    expect(body).toBeDefined();
    expect(mockLoginController.login).toHaveBeenCalled();
    expect(body).toStrictEqual(loginData);
    expect(response.status).toBe(StatusCodes.OK);
  });
});
