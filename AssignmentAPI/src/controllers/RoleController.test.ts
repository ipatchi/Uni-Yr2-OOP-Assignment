import { Role } from '../entity/Role';
import { RoleController } from './RoleController';
import { Repository } from 'typeorm';
import { StatusCodes } from 'http-status-codes';
import { ResponseHandler } from '../helpers/ResponseHandler';
import { Request, Response } from 'express';
import { DeleteResult } from 'typeorm';
import * as classValidator from 'class-validator';
import { mock } from 'jest-mock-extended';
import { RoleName } from '../types/RoleName';

const VALIDATOR_CONTRAINT_NAME_IS_REQUIRED = 'Name is required';
const VALIDATOR_CONTRAINT_EMPTY_OR_WHITESPACE =
  'Name cannot be empty or whitespace';
const VALIDATOR_CONTSTRAINT_MAX_LENGTH_EXCEEDED =
  'Name must be 30 characters or less';

const INVALID_ROLE_ID_NUMBER = 99;
const INVALID_ROLE_ID_TYPE = 'abc';
const BLANK_ROLE_NAME = '';

jest.mock('../helpers/ResponseHandler');

jest.mock('class-validator', () => ({
  ...jest.requireActual('class-validator'),
  validate: jest.fn(),
}));

describe('Role Controller', () => {
  function getValidManagerData(): Role {
    let role = new Role();
    role.roleID = 1;
    role.name = RoleName.EMPLOYEE;
    return role;
  }

  const mockRequest = (params = {}, body = {}): Partial<Request> => ({
    params,
    body,
  });

  const mockResponse = (): Partial<Response> => ({});

  let roleController: RoleController;
  let mockRoleRepository: jest.Mocked<Repository<Role>>;

  beforeEach(() => {
    mockRoleRepository = mock<Repository<Role>>();
    roleController = new RoleController();
    roleController['roleRepository'] = mockRoleRepository as Repository<Role>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getAll returns NO_CONTENT if no roles exist', async () => {
    const req = mockRequest();
    const res = mockResponse();
    mockRoleRepository.find.mockResolvedValue([]);
    await roleController.getAll(req as Request, res as Response);
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.NO_CONTENT
    );
  });

  it('getAll returns all roles', async () => {
    const validManagerDetails = getValidManagerData();
    const req = mockRequest();
    const res = mockResponse();
    mockRoleRepository.find.mockResolvedValue([validManagerDetails]);
    await roleController.getAll(req as Request, res as Response);
    expect(mockRoleRepository.find).toHaveBeenCalled();
    expect(ResponseHandler.sendSuccessResponse).toHaveBeenCalledWith(res, [
      validManagerDetails,
    ]);
  });

  it('getAll returns INTERNAL_SERVICE_ERROR if server fails to retrieve roles', async () => {
    const req = mockRequest();
    const res = mockResponse();
    mockRoleRepository.find.mockRejectedValue(
      new Error('Database connection error')
    );
    await roleController.getAll(req as Request, res as Response);
    expect(mockRoleRepository.find).toHaveBeenCalled();
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      RoleController.ERROR_FAILED_TO_RETRIEVE_ROLES
    );
  });

  it('getByID returns an error if an invalid ID is supplied ', async () => {
    const req = mockRequest({ id: INVALID_ROLE_ID_TYPE });
    const res = mockResponse();

    await roleController.getById(req as Request, res as Response);

    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.BAD_REQUEST,
      RoleController.ERROR_INVALID_ID_FORMAT
    );
  });

  it('getByID returns a role if a valid ID is supplied ', async () => {
    const validManagerDetails = getValidManagerData();
    const req = mockRequest({ roleID: validManagerDetails.roleID });
    const res = mockResponse();

    mockRoleRepository.findOne.mockResolvedValue(validManagerDetails);

    await roleController.getById(req as Request, res as Response);

    expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
      where: { roleID: validManagerDetails.roleID },
    });

    expect(ResponseHandler.sendSuccessResponse).toHaveBeenCalledWith(
      res,
      validManagerDetails
    );
  });

  it('getByID returns INTERNAL_SERVER_ERROR if server fails to retrieve role by id ', async () => {
    const validManagerDetails = getValidManagerData();
    const req = mockRequest({ roleID: validManagerDetails.roleID });
    const res = mockResponse();

    mockRoleRepository.findOne.mockRejectedValue(
      new Error('Database connection error')
    );

    await roleController.getById(req as Request, res as Response);

    expect(mockRoleRepository.findOne).toHaveBeenCalled();

    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      RoleController.ERROR_FAILED_TO_RETRIEVE_ROLE
    );
  });

  it('create will return BAD_REQUEST if the role name is missing ', async () => {
    const req = mockRequest();
    const res = mockResponse();

    jest.spyOn(classValidator, 'validate').mockResolvedValue([
      {
        property: 'name',
        constraints: {
          isNotEmpty: VALIDATOR_CONTRAINT_NAME_IS_REQUIRED,
        },
      },
    ]);

    await roleController.create(req as Request, res as Response);

    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.BAD_REQUEST,
      VALIDATOR_CONTRAINT_NAME_IS_REQUIRED
    );
  });

  it('create will return BAD_REQUEST if the role name is not a string ', async () => {
    const req = mockRequest(BLANK_ROLE_NAME);
    const res = mockResponse();

    jest.spyOn(classValidator, 'validate').mockResolvedValue([
      {
        property: 'name',
        constraints: {
          Matches: VALIDATOR_CONTRAINT_EMPTY_OR_WHITESPACE,
        },
      },
    ]);

    await roleController.create(req as Request, res as Response);

    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.BAD_REQUEST,
      VALIDATOR_CONTRAINT_EMPTY_OR_WHITESPACE
    );
  });

  it('create will return BAD_REQUEST if the role name is longer than 30 characters ', async () => {
    const longRoleName = 'x'.repeat(31);
    const req = mockRequest({ name: longRoleName });
    const res = mockResponse();

    jest.spyOn(classValidator, 'validate').mockResolvedValue([
      {
        property: 'name',
        constraints: {
          Matches: VALIDATOR_CONTSTRAINT_MAX_LENGTH_EXCEEDED,
        },
      },
    ]);

    await roleController.create(req as Request, res as Response);

    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.BAD_REQUEST,
      VALIDATOR_CONTSTRAINT_MAX_LENGTH_EXCEEDED
    );
  });

  it('create a new role with valid data ', async () => {
    const validManagerDetails = getValidManagerData();
    const req = mockRequest({}, { name: validManagerDetails.name });
    const res = mockResponse();

    mockRoleRepository.save.mockResolvedValue(validManagerDetails);
    jest.spyOn(classValidator, 'validate').mockResolvedValue([]);

    await roleController.create(req as Request, res as Response);

    expect(mockRoleRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: validManagerDetails.name })
    );

    expect(ResponseHandler.sendSuccessResponse).toHaveBeenCalledWith(
      res,
      validManagerDetails,
      StatusCodes.CREATED
    );
  });
});
