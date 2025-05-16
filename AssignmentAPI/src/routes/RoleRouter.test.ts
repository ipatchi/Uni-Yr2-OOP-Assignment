import request from 'supertest';
import express, { Router } from 'express';
import { RoleRouter } from './RoleRouter';
import { RoleController } from '../controllers/RoleController';
import { StatusCodes } from 'http-status-codes';
import { toNamespacedPath } from 'path';

const mockRoleController = {
  delete: jest.fn((req, res) =>
    res.status(StatusCodes.OK).json({ roleID: req.params.roleID })
  ),
  getAll: jest.fn((req, res) => res.status(StatusCodes.OK).json([])),
  getById: jest.fn((req, res) =>
    res.status(StatusCodes.OK).json({ roleID: req.params.roleID })
  ),
  create: jest.fn((req, res) => res.status(StatusCodes.CREATED).json(req.body)),
  update: jest.fn((req, res) => res.status(StatusCodes.OK).json(req.body)),
} as unknown as RoleController;

const router = Router();
jest.spyOn(router, 'get');
jest.spyOn(router, 'post');
jest.spyOn(router, 'patch');
jest.spyOn(router, 'delete');
jest.spyOn(router, 'use');

const app = express();
app.use(express.json());

const roleRouter = new RoleRouter(router, mockRoleController);
app.use('/roles', roleRouter.getRouter());

const BASE_ROLES_URL = '/roles';

describe('RoleRouter tests', () => {
  it('getAll on GET /roles can be called', async () => {
    const response = await request(app)
      .get(BASE_ROLES_URL)
      .expect(StatusCodes.OK);
    expect(mockRoleController.getAll).toHaveBeenCalled();
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toEqual([]);
  });

  it('getByID route GET /roles/:roleID can be called', async () => {
    const endPoint = `${BASE_ROLES_URL}/1`;
    const response = await request(app).get(endPoint).expect(StatusCodes.OK);

    let requestedURL = (mockRoleController.getById as jest.Mock).mock
      .calls[0][0].originalUrl;
    expect(requestedURL).toBeDefined();
    expect(requestedURL).toBe(endPoint);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toEqual({ roleID: '1' });
  });

  it('create route POST /roles can be called', async () => {
    const newRoleData = { name: 'manager' };
    const response = await request(app)
      .post(BASE_ROLES_URL)
      .send(newRoleData)
      .expect(StatusCodes.CREATED);

    let body = (mockRoleController.create as jest.Mock).mock.calls[0][0].body;

    expect(body).toBeDefined();
    expect(mockRoleController.create).toHaveBeenCalled();
    expect(body).toStrictEqual(newRoleData);
    expect(response.status).toBe(StatusCodes.CREATED);
  });

  it('update route PATCH /roles can be called', async () => {
    const updateRoleData = { roleID: 1, name: 'UpdatedRole' };
    const response = await request(app)
      .patch(BASE_ROLES_URL)
      .send(updateRoleData)
      .expect(StatusCodes.OK);

    let body = (mockRoleController.update as jest.Mock).mock.calls[0][0].body;

    expect(body).toBeDefined();
    expect(mockRoleController.update).toHaveBeenCalled();
    expect(body).toStrictEqual(updateRoleData);
    expect(response.status).toBe(StatusCodes.OK);
  });

  it('delete route DELETE /roles can be called', async () => {
    const endpoint = `${BASE_ROLES_URL}/1`;
    const response = await request(app).delete(endpoint).expect(StatusCodes.OK);

    let url = (mockRoleController.delete as jest.Mock).mock.calls[0][0]
      .originalUrl;

    expect(url).toBeDefined();
    expect(mockRoleController.delete).toHaveBeenCalled();
    expect(url).toBe(endpoint);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toEqual({ roleID: '1' });
  });
});
