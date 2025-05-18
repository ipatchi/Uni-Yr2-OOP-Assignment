import request from 'supertest';
import express, { Router } from 'express';
import { UserRouter } from './UserRouter';
import { UserController } from '../controllers/UserController';
import { StatusCodes } from 'http-status-codes';
import { toNamespacedPath } from 'path';

const mockUserController = {
  delete: jest.fn((req, res) =>
    res.status(StatusCodes.OK).json({ userID: req.params.id })
  ),
  getAll: jest.fn((req, res) => res.status(StatusCodes.OK).json([])),
  getByID: jest.fn((req, res) =>
    res.status(StatusCodes.OK).json({ userID: req.params.id })
  ),
  getByEmail: jest.fn((req, res) =>
    res.status(StatusCodes.OK).json({ email: req.params.emailAddress })
  ),
  create: jest.fn((req, res) => res.status(StatusCodes.CREATED).json(req.body)),
  update: jest.fn((req, res) => res.status(StatusCodes.OK).json(req.body)),
} as unknown as UserController;

jest.mock('../helpers/AuthoriseRole', () => ({
  authoriseRole: () => (req: any, res: any, next: any) => next(),
}));

const router = Router();
jest.spyOn(router, 'get');
jest.spyOn(router, 'post');
jest.spyOn(router, 'patch');
jest.spyOn(router, 'delete');
jest.spyOn(router, 'use');

const app = express();
app.use(express.json());

const userRouter = new UserRouter(router, mockUserController);
app.use('/users', userRouter.getRouter());

const BASE_ROLES_URL = '/users';

describe('UserRouter tests', () => {
  it('getAll on GET /users can be called', async () => {
    const response = await request(app)
      .get(BASE_ROLES_URL)
      .expect(StatusCodes.OK);
    expect(mockUserController.getAll).toHaveBeenCalled();
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toEqual([]);
  });

  it('getByID route GET /users/:userID can be called', async () => {
    const endPoint = `${BASE_ROLES_URL}/1`;
    const response = await request(app).get(endPoint).expect(StatusCodes.OK);

    let requestedURL = (mockUserController.getByID as jest.Mock).mock
      .calls[0][0].originalUrl;
    expect(requestedURL).toBeDefined();
    expect(requestedURL).toBe(endPoint);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toEqual({ userID: '1' });
  });

  it('getByEmail route GET /users/email/:userEmail can be called', async () => {
    const endPoint = `${BASE_ROLES_URL}/email/user@email.com`;
    const response = await request(app).get(endPoint).expect(StatusCodes.OK);

    let requestedURL = (mockUserController.getByEmail as jest.Mock).mock
      .calls[0][0].originalUrl;
    expect(requestedURL).toBeDefined();
    expect(requestedURL).toBe(endPoint);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toEqual({ email: 'user@email.com' });
  });

  it('create route POST /users can be called', async () => {
    const newUserData = {
      email: 'employee1@email.com',
      password: 'employee12345',
      roleID: 3,
      firstname: 'Harry',
      surname: 'Playle',
    };
    const response = await request(app)
      .post(BASE_ROLES_URL)
      .send(newUserData)
      .expect(StatusCodes.CREATED);

    let body = (mockUserController.create as jest.Mock).mock.calls[0][0].body;

    expect(body).toBeDefined();
    expect(mockUserController.create).toHaveBeenCalled();
    expect(body).toStrictEqual(newUserData);
    expect(response.status).toBe(StatusCodes.CREATED);
  });

  it('update route PATCH /users can be called', async () => {
    const updateUserData = {
      id: 1,
      email: 'test@email.com',
      roleID: 2,
    };
    const response = await request(app)
      .patch(BASE_ROLES_URL)
      .send(updateUserData)
      .expect(StatusCodes.OK);

    let body = (mockUserController.update as jest.Mock).mock.calls[0][0].body;

    expect(body).toBeDefined();
    expect(mockUserController.update).toHaveBeenCalled();
    expect(body).toStrictEqual(updateUserData);
    expect(response.status).toBe(StatusCodes.OK);
  });

  it('delete route DELETE /users can be called', async () => {
    const endpoint = `${BASE_ROLES_URL}/1`;
    const response = await request(app).delete(endpoint).expect(StatusCodes.OK);

    let url = (mockUserController.delete as jest.Mock).mock.calls[0][0]
      .originalUrl;

    expect(url).toBeDefined();
    expect(mockUserController.delete).toHaveBeenCalled();
    expect(url).toBe(endpoint);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toEqual({ userID: '1' });
  });
});
