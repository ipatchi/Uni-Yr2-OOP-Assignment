import request from 'supertest';
import express, { Router } from 'express';
import { ManagerRouter } from './ManagerRouter';
import { ManagerController } from '../controllers/ManagerController';
import { StatusCodes } from 'http-status-codes';
import { toNamespacedPath } from 'path';

const mockManagerController = {
  getAll: jest.fn((req, res) => res.status(StatusCodes.OK).json([])),
  getByUserID: jest.fn((req, res) =>
    res.status(StatusCodes.OK).json({ userID: req.params.userID })
  ),
  create: jest.fn((req, res) => res.status(StatusCodes.CREATED).json(req.body)),
  delete: jest.fn((req, res) =>
    res.status(StatusCodes.OK).json({ userID: req.params.id })
  ),
  updateManager: jest.fn((req, res) =>
    res.status(StatusCodes.OK).json(req.body)
  ),
} as unknown as ManagerController;

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

const managerRouter = new ManagerRouter(router, mockManagerController);
app.use('/managers', managerRouter.getRouter());

const BASE_ROLES_URL = '/managers';

describe('ManagerRouter tests', () => {
  it('getAll on GET /managers can be called', async () => {
    const response = await request(app)
      .get(BASE_ROLES_URL)
      .expect(StatusCodes.OK);
    expect(mockManagerController.getAll).toHaveBeenCalled();
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toEqual([]);
  });

  it('getByID route GET /managers/:userID can be called', async () => {
    const endPoint = `${BASE_ROLES_URL}/1`;
    const response = await request(app).get(endPoint).expect(StatusCodes.OK);

    let requestedURL = (mockManagerController.getByUserID as jest.Mock).mock
      .calls[0][0].originalUrl;
    expect(requestedURL).toBeDefined();
    expect(requestedURL).toBe(endPoint);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toEqual({ userID: '1' });
  });

  it('create manager pair POST /managers can be called', async () => {
    const newManagerData = {
      userID: 2,
      managerID: 1,
    };

    const response = await request(app)
      .post(BASE_ROLES_URL)
      .send(newManagerData)
      .expect(StatusCodes.CREATED);

    let body = (mockManagerController.create as jest.Mock).mock.calls[0][0]
      .body;

    expect(body).toBeDefined();
    expect(mockManagerController.create).toHaveBeenCalled();
    expect(body).toStrictEqual(newManagerData);
    expect(response.status).toBe(StatusCodes.CREATED);
  });

  it('update route PATCH /managers can be called', async () => {
    const updateManagerData = {
      userID: 2,
      managerID: 1,
    };
    const response = await request(app)
      .patch(BASE_ROLES_URL)
      .send(updateManagerData)
      .expect(StatusCodes.OK);

    let body = (mockManagerController.updateManager as jest.Mock).mock
      .calls[0][0].body;

    expect(body).toBeDefined();
    expect(mockManagerController.updateManager).toHaveBeenCalled();
    expect(body).toStrictEqual(updateManagerData);
    expect(response.status).toBe(StatusCodes.OK);
  });

  it('delete route DELETE /managers can be called', async () => {
    const endpoint = `${BASE_ROLES_URL}/1`;
    const response = await request(app).delete(endpoint).expect(StatusCodes.OK);

    let url = (mockManagerController.delete as jest.Mock).mock.calls[0][0]
      .originalUrl;

    expect(url).toBeDefined();
    expect(mockManagerController.delete).toHaveBeenCalled();
    expect(url).toBe(endpoint);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toEqual({ userID: '1' });
  });
});
