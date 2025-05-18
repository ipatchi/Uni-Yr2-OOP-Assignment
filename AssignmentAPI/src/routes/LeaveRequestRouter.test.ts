import request from 'supertest';
import express, { Router } from 'express';
import { LeaveRequestRouter } from './LeaveRequestRouter';
import { LeaveRequestController } from '../controllers/LeaveRequestController';
import { StatusCodes } from 'http-status-codes';
import { toNamespacedPath } from 'path';

const mockLeaveRequestController = {
  cancelLeave: jest.fn((req, res) => res.status(StatusCodes.OK).json(req.body)),
  getStatus: jest.fn((req, res) =>
    res.status(StatusCodes.OK).json({ userID: req.params.userID })
  ),
  getBalance: jest.fn((req, res) =>
    res.status(StatusCodes.OK).json({ userID: req.params.userID })
  ),
  addLeave: jest.fn((req, res) =>
    res.status(StatusCodes.CREATED).json(req.body)
  ),
  approveLeave: jest.fn((req, res) =>
    res.status(StatusCodes.OK).json(req.body)
  ),
  rejectLeave: jest.fn((req, res) => res.status(StatusCodes.OK).json(req.body)),
} as unknown as LeaveRequestController;

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

const leaveRequestRouter = new LeaveRequestRouter(
  router,
  mockLeaveRequestController
);
app.use('/users', leaveRequestRouter.getRouter());

const BASE_ROLES_URL = '/users';

describe('LeaveRequestRouter tests', () => {
  it('getStatus route GET /leave-requests/status/:userID can be called', async () => {
    const endPoint = `${BASE_ROLES_URL}/status/1`;
    const response = await request(app).get(endPoint).expect(StatusCodes.OK);

    let requestedURL = (mockLeaveRequestController.getStatus as jest.Mock).mock
      .calls[0][0].originalUrl;
    expect(requestedURL).toBeDefined();
    expect(requestedURL).toBe(endPoint);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toEqual({ userID: '1' });
  });

  it('getBalance route GET /leave-requests/remaining/:userID can be called', async () => {
    const endPoint = `${BASE_ROLES_URL}/remaining/1`;
    const response = await request(app).get(endPoint).expect(StatusCodes.OK);

    let requestedURL = (mockLeaveRequestController.getBalance as jest.Mock).mock
      .calls[0][0].originalUrl;
    expect(requestedURL).toBeDefined();
    expect(requestedURL).toBe(endPoint);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toEqual({ userID: '1' });
  });

  it('create route POST /leave-requests can be called', async () => {
    const newRequestData = {
      userID: 3,
      startDate: '2025-03-19',
      endDate: '2025-03-19',
    };
    const response = await request(app)
      .post(BASE_ROLES_URL)
      .send(newRequestData)
      .expect(StatusCodes.CREATED);

    let body = (mockLeaveRequestController.addLeave as jest.Mock).mock
      .calls[0][0].body;

    expect(body).toBeDefined();
    expect(mockLeaveRequestController.addLeave).toHaveBeenCalled();
    expect(body).toStrictEqual(newRequestData);
    expect(response.status).toBe(StatusCodes.CREATED);
  });

  it('update approve route PATCH /leave-requests/approve can be called', async () => {
    const url = `${BASE_ROLES_URL}/approve`;
    const approveReqData = {
      userID: 1,
      leaveRequestID: 1,
      reason: 'Ok to approve',
    };
    const response = await request(app)
      .patch(url)
      .send(approveReqData)
      .expect(StatusCodes.OK);

    let body = (mockLeaveRequestController.approveLeave as jest.Mock).mock
      .calls[0][0].body;

    expect(body).toBeDefined();
    expect(mockLeaveRequestController.approveLeave).toHaveBeenCalled();
    expect(body).toStrictEqual(approveReqData);
    expect(response.status).toBe(StatusCodes.OK);
  });

  it('update reject route PATCH /leave-requests/reject can be called', async () => {
    const url = `${BASE_ROLES_URL}/reject`;
    const rejectReqData = {
      userID: 1,
      leaveRequestID: 1,
      reason: 'Too busy period',
    };
    const response = await request(app)
      .patch(url)
      .send(rejectReqData)
      .expect(StatusCodes.OK);

    let body = (mockLeaveRequestController.rejectLeave as jest.Mock).mock
      .calls[0][0].body;

    expect(body).toBeDefined();
    expect(mockLeaveRequestController.rejectLeave).toHaveBeenCalled();
    expect(body).toStrictEqual(rejectReqData);
    expect(response.status).toBe(StatusCodes.OK);
  });

  it('cancel leave route DELETE /leave-requests can be called', async () => {
    const cancelReqData = {
      userID: 1,
      leaveRequestID: 1,
    };
    const response = await request(app)
      .delete(BASE_ROLES_URL)
      .send(cancelReqData)
      .expect(StatusCodes.OK);

    let body = (mockLeaveRequestController.cancelLeave as jest.Mock).mock
      .calls[0][0].body;

    expect(body).toBeDefined();
    expect(mockLeaveRequestController.cancelLeave).toHaveBeenCalled();
    expect(body).toStrictEqual(cancelReqData);
    expect(response.status).toBe(StatusCodes.OK);
  });
});
