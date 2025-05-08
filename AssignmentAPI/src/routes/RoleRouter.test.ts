import request from 'supertest';
import express, { Router } from 'express';
import { RoleRouter } from './RoleRouter';
import { RoleController } from '../controllers/RoleController';
import { StatusCodes } from 'http-status-codes';

const mockRoleController = {
  delete: jest.fn((req, res) =>
    res.status(StatusCodes.OK).json({ id: req.params.id })
  ),
  getAll: jest.fn((req, res) => res.status(StatusCodes.OK).json([])),
  getById: jest.fn((req, res) =>
    res.status(StatusCodes.OK).json({ id: req.params.id })
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

  it('getByID route GET /roles/:id can be called', async () => {
    const endPoint = `${BASE_ROLES_URL}/1`;
    const response = await request(app).get(endPoint).expect(StatusCodes.OK);

    let requestedURL = (mockRoleController.getById as jest.Mock).mock
      .calls[0][0].originalUrl;
    expect(requestedURL).toBeDefined();
    expect(requestedURL).toBe(endPoint);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toEqual({ id: '1' });
  });
});
