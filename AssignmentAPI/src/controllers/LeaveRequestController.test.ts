import { LeaveRequestController } from '../controllers/LeaveRequestController';
import { User } from '../entity/User';
import { Role } from '../entity/Role';
import { Repository } from 'typeorm';
import { StatusCodes } from 'http-status-codes';
import { ResponseHandler } from '../helpers/ResponseHandler';
import { Request, Response } from 'express';
import * as classValidator from 'class-validator';
import * as classTransformer from 'class-transformer';
import { mock } from 'jest-mock-extended';
import { RoleName } from '../types/RoleName';
import { LeaveRequest } from '../entity/LeaveRequest';

jest.mock('../helpers/ResponseHandler');

jest.mock('class-validator', () => ({
  ...jest.requireActual('class-validator'),
  validate: jest.fn(),
}));

jest.mock('class-transformer', () => ({
  ...jest.requireActual('class-transformer'),
  instanceToPlain: jest.fn(),
}));

const VALIDATOR_CONSTRAINT_ERROR_NO_ID_PROVIDED = 'No userID provided.';
const VALIDATOR_CONSTRAINT_ERROR_NO_START_DATE_PROVIDED =
  'No start date provided.';
const VALIDATOR_CONSTRAINT_ERROR_NO_END_DATE_PROVIDED = 'No end date provided.';

describe('Leave Request Controller Tests', () => {
  function getValidLeaveRequestData(): LeaveRequest {
    let user = new User();
    user.userID = 1;

    let leaveReq = new LeaveRequest();

    leaveReq.userID = user;
    leaveReq.startDate = new Date('01-01-2024');
    leaveReq.endDate = new Date('02-02-2024');
    leaveReq.leaveType = 'Annual';
    leaveReq.status = 'Pending';
    leaveReq.reason = 'OK to Approve';

    return leaveReq;
  }

  const mockRequest = (params = {}, body = {}): Partial<Request> => ({
    params,
    body,
  });

  const mockResponse = (): Partial<Response> => ({});

  let leaveRequestController: LeaveRequestController;
  let mockLeaveRequestRepository: jest.Mocked<Repository<LeaveRequest>>;

  let mockUserRepository: jest.Mocked<Repository<User>>;

  beforeEach(() => {
    mockLeaveRequestRepository = mock<Repository<LeaveRequest>>();
    mockUserRepository = mock<Repository<User>>();

    leaveRequestController = new LeaveRequestController();
    leaveRequestController['leaveRequestRepository'] =
      mockLeaveRequestRepository as Repository<LeaveRequest>;
    leaveRequestController['userRepository'] =
      mockUserRepository as Repository<User>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('CREATE will return BAD_REQUEST if no user ID was provided', async () => {
    const validReqDetails = getValidLeaveRequestData();
    const req = mockRequest(
      {},
      {
        startDate: validReqDetails.startDate,
        endDate: validReqDetails.endDate,
      }
    );
    const res = mockResponse();

    const EXPECTED_ERROR_MESSAGE = VALIDATOR_CONSTRAINT_ERROR_NO_ID_PROVIDED;
    jest.spyOn(classValidator, 'validate').mockResolvedValue([
      {
        property: 'userID',
        constraints: {
          MinLength: VALIDATOR_CONSTRAINT_ERROR_NO_ID_PROVIDED,
        },
      },
    ]);

    await leaveRequestController.addLeave(req as Request, res as Response);
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.BAD_REQUEST,
      EXPECTED_ERROR_MESSAGE
    );
  });
  it('CREATE will return BAD_REQUEST if no startDate was provided', async () => {
    const validReqDetails = getValidLeaveRequestData();
    const req = mockRequest(
      {},
      {
        userID: validReqDetails.userID,
        endDate: validReqDetails.endDate,
      }
    );
    const res = mockResponse();

    const EXPECTED_ERROR_MESSAGE =
      VALIDATOR_CONSTRAINT_ERROR_NO_START_DATE_PROVIDED;
    jest.spyOn(classValidator, 'validate').mockResolvedValue([
      {
        property: 'startDate',
        constraints: {
          MinLength: VALIDATOR_CONSTRAINT_ERROR_NO_START_DATE_PROVIDED,
        },
      },
    ]);

    await leaveRequestController.addLeave(req as Request, res as Response);
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.BAD_REQUEST,
      EXPECTED_ERROR_MESSAGE
    );
  });

  it('CREATE will return BAD_REQUEST if no End Date was provided', async () => {
    const validReqDetails = getValidLeaveRequestData();
    const req = mockRequest(
      {},
      {
        startDate: validReqDetails.startDate,
        userID: validReqDetails.userID,
      }
    );
    const res = mockResponse();

    const EXPECTED_ERROR_MESSAGE =
      VALIDATOR_CONSTRAINT_ERROR_NO_END_DATE_PROVIDED;
    jest.spyOn(classValidator, 'validate').mockResolvedValue([
      {
        property: 'endDate',
        constraints: {
          MinLength: VALIDATOR_CONSTRAINT_ERROR_NO_END_DATE_PROVIDED,
        },
      },
    ]);

    await leaveRequestController.addLeave(req as Request, res as Response);
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.BAD_REQUEST,
      EXPECTED_ERROR_MESSAGE
    );
  });
});
