import { UserController } from '../controllers/UserController';
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

const VALIDATOR_CONSTRAINT_PASSWORD_AT_LEAST_10_CHARS =
  'Password must be at least 10 characters long';

const VALIDATOR_CONSTRAINT_EMAIL_MUST_BE_VALID =
  'Email must be a valid email address';

const VALIDATOR_CONSTRAINT_ROLE_MUST_BE_VALID = 'Role must be a valid role';

const VALIDATOR_CONSTRAINT_FIRSTNAME_MUST_BE_VALID = 'Firstname must be valid';

const VALIDATOR_CONSTRAINT_SURNAME_MUST_BE_VALID = 'Surname must be valid';

const VALIDATOR_CONSTRAINT_ID_MUST_BE_PROVIDED = 'ID not provided.';

jest.mock('../helpers/ResponseHandler');

jest.mock('class-validator', () => ({
  ...jest.requireActual('class-validator'),
  validate: jest.fn(),
}));

jest.mock('class-transformer', () => ({
  ...jest.requireActual('class-transformer'),
  instanceToPlain: jest.fn(),
}));

describe('User Controller Tests', () => {
  function getValidManagerData(): User {
    let role = new Role();
    role.roleID = 1;
    role.name = RoleName.MANAGER;

    let user = new User();
    user.userID = 1;
    user.password = 'a'.repeat(10);
    user.email = 'manager@email.com';
    user.firstname = 'Charlie';
    user.surname = 'Smith';
    user.annualLeaveBalance = 25;
    user.roleID = role;
    return user;
  }

  function getValidStaffData(): User {
    let role = new Role();
    role.roleID = 2;
    role.name = RoleName.EMPLOYEE;

    let user = new User();
    user.userID = 1;
    user.password = 'b'.repeat(10);
    user.email = 'staff@email.com';
    user.firstname = 'Kieran';
    user.surname = 'Wilson';
    user.annualLeaveBalance = 25;
    user.roleID = role;
    return user;
  }

  const mockRequest = (params = {}, body = {}): Partial<Request> => ({
    params,
    body,
  });

  const mockResponse = (): Partial<Response> => ({});

  let userController: UserController;
  let mockUserRepository: jest.Mocked<Repository<User>>;

  beforeEach(() => {
    mockUserRepository = mock<Repository<User>>();
    userController = new UserController();
    userController['userRepository'] = mockUserRepository as Repository<User>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  //getAll test for NO_CONTENT - same as RoleController test version
  it('getAll returns NO_CONTENT if no users exist', async () => {
    const req = mockRequest();
    const res = mockResponse();
    mockUserRepository.find.mockResolvedValue([]);
    await userController.getAll(req as Request, res as Response);
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.NO_CONTENT
    );
  });

  //getAll test INTERNAL_SERVER_ERROR - same as RoleController test version

  it('getAll returns INTERNAL_SERVICE_ERROR if server fails to retrieve users', async () => {
    const req = mockRequest();
    const res = mockResponse();
    mockUserRepository.find.mockRejectedValue(
      new Error('Database connection error')
    );
    await userController.getAll(req as Request, res as Response);
    expect(mockUserRepository.find).toHaveBeenCalled();
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      UserController.ERROR_FAILED_TO_RETRIEVE_USERS
    );
  });

  it('getAll will return all users', async () => {
    const mockUsers: User[] = [getValidManagerData(), getValidStaffData()];
    const req = mockRequest();
    const res = mockResponse();

    mockUserRepository.find.mockResolvedValue(mockUsers);

    await userController.getAll(req as Request, res as Response);

    expect(mockUserRepository.find).toHaveBeenCalledWith({
      relations: ['roleID'],
    });
    expect(ResponseHandler.sendSuccessResponse).toHaveBeenCalledWith(
      res,
      mockUsers
    );
  });

  it('CREATE will return BAD_REQUEST if no user password was provided', async () => {
    const validManagerDetails = getValidManagerData();
    const req = mockRequest(
      {},
      {
        email: validManagerDetails.email,
        roleId: validManagerDetails.roleID,
        firstname: validManagerDetails.firstname,
        surname: validManagerDetails.surname,
      }
    );
    const res = mockResponse();

    const EXPECTED_ERROR_MESSAGE =
      VALIDATOR_CONSTRAINT_PASSWORD_AT_LEAST_10_CHARS;
    jest.spyOn(classValidator, 'validate').mockResolvedValue([
      {
        property: 'password',
        constraints: {
          MinLength: VALIDATOR_CONSTRAINT_PASSWORD_AT_LEAST_10_CHARS,
        },
      },
    ]);

    await userController.create(req as Request, res as Response);
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.BAD_REQUEST,
      EXPECTED_ERROR_MESSAGE
    );
  });

  it('CREATE will return BAD_REQUEST if no user email was provided', async () => {
    const validManagerDetails = getValidManagerData();
    const req = mockRequest(
      {},
      {
        password: validManagerDetails.password,
        roleId: validManagerDetails.roleID,
        firstname: validManagerDetails.firstname,
        surname: validManagerDetails.surname,
      }
    );
    const res = mockResponse();

    const EXPECTED_ERROR_MESSAGE = VALIDATOR_CONSTRAINT_EMAIL_MUST_BE_VALID;
    jest.spyOn(classValidator, 'validate').mockResolvedValue([
      {
        property: 'email',
        constraints: {
          IsEmail: VALIDATOR_CONSTRAINT_EMAIL_MUST_BE_VALID,
        },
      },
    ]);

    await userController.create(req as Request, res as Response);
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.BAD_REQUEST,
      EXPECTED_ERROR_MESSAGE
    );
  });

  it('CREATE will return BAD_REQUEST if no user role was provided', async () => {
    const validManagerDetails = getValidManagerData();
    const req = mockRequest(
      {},
      {
        password: validManagerDetails.password,
        email: validManagerDetails.email,
        firstname: validManagerDetails.firstname,
        surname: validManagerDetails.surname,
      }
    );
    const res = mockResponse();

    const EXPECTED_ERROR_MESSAGE = VALIDATOR_CONSTRAINT_ROLE_MUST_BE_VALID;
    jest.spyOn(classValidator, 'validate').mockResolvedValue([
      {
        property: 'roleID',
        constraints: {
          IsDefined: VALIDATOR_CONSTRAINT_ROLE_MUST_BE_VALID,
        },
      },
    ]);

    await userController.create(req as Request, res as Response);
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.BAD_REQUEST,
      EXPECTED_ERROR_MESSAGE
    );
  });

  it('CREATE will return BAD_REQUEST if no firstname was provided', async () => {
    const validManagerDetails = getValidManagerData();
    const req = mockRequest(
      {},
      {
        password: validManagerDetails.password,
        email: validManagerDetails.email,
        roleID: validManagerDetails.roleID,
        surname: validManagerDetails.surname,
      }
    );
    const res = mockResponse();

    const EXPECTED_ERROR_MESSAGE = VALIDATOR_CONSTRAINT_FIRSTNAME_MUST_BE_VALID;
    jest.spyOn(classValidator, 'validate').mockResolvedValue([
      {
        property: 'firstname',
        constraints: {
          IsDefined: VALIDATOR_CONSTRAINT_FIRSTNAME_MUST_BE_VALID,
        },
      },
    ]);

    await userController.create(req as Request, res as Response);
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.BAD_REQUEST,
      EXPECTED_ERROR_MESSAGE
    );
  });

  it('CREATE will return BAD_REQUEST if no surname was provided', async () => {
    const validManagerDetails = getValidManagerData();
    const req = mockRequest(
      {},
      {
        password: validManagerDetails.password,
        email: validManagerDetails.email,
        roleID: validManagerDetails.roleID,
        firstname: validManagerDetails.firstname,
      }
    );
    const res = mockResponse();

    const EXPECTED_ERROR_MESSAGE = VALIDATOR_CONSTRAINT_SURNAME_MUST_BE_VALID;
    jest.spyOn(classValidator, 'validate').mockResolvedValue([
      {
        property: 'surname',
        constraints: {
          IsDefined: VALIDATOR_CONSTRAINT_SURNAME_MUST_BE_VALID,
        },
      },
    ]);

    await userController.create(req as Request, res as Response);
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.BAD_REQUEST,
      EXPECTED_ERROR_MESSAGE
    );
  });

  it('CREATE will return a valid user and return CREATED status when supplied with valid details', async () => {
    const validManagerDetails = getValidManagerData();

    const req = mockRequest(
      {},
      {
        password: validManagerDetails.password,
        email: validManagerDetails.email,
        roleID: validManagerDetails.roleID,
        firstname: validManagerDetails.firstname,
        surname: validManagerDetails.surname,
      }
    );
    const res = mockResponse();

    mockUserRepository.save.mockResolvedValue(validManagerDetails);

    jest.spyOn(classTransformer, 'instanceToPlain').mockReturnValue({
      userID: validManagerDetails.userID,
      email: validManagerDetails.email,
      roleID: {
        roleID: validManagerDetails.roleID.roleID,
        name: validManagerDetails.roleID.name,
      },
      firstname: validManagerDetails.firstname,
      surname: validManagerDetails.surname,
      annualLeaveBalance: validManagerDetails.annualLeaveBalance,
    } as any);

    jest.spyOn(classValidator, 'validate').mockResolvedValue([]);

    await userController.create(req as Request, res as Response);

    expect(mockUserRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        password: validManagerDetails.password,
        email: validManagerDetails.email,
        roleID: validManagerDetails.roleID,
        firstname: validManagerDetails.firstname,
        surname: validManagerDetails.surname,
        annualLeaveBalance: validManagerDetails.annualLeaveBalance,
      })
    );

    expect(ResponseHandler.sendSuccessResponse).toHaveBeenCalledWith(
      res,
      {
        userID: validManagerDetails.userID,
        email: validManagerDetails.email,
        roleID: validManagerDetails.roleID,
        firstname: validManagerDetails.firstname,
        surname: validManagerDetails.surname,
        annualLeaveBalance: validManagerDetails.annualLeaveBalance,
      },
      StatusCodes.CREATED
    );
  });

  //Delete tests

  it('DELETE returns a BAD_REQUEST if no id is provided', async () => {
    const req = mockRequest(); //Invalid/no id
    const res = mockResponse();

    await userController.delete(req as Request, res as Response);

    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.BAD_REQUEST,
      UserController.ERROR_ID_NOT_FOUND
    );
  });

  it('DELETE returns OK if successful', async () => {
    const { userID } = getValidManagerData();
    console.log(userID);

    const req = mockRequest({ id: userID }, {});
    const res = mockResponse();

    mockUserRepository.delete.mockResolvedValue({ raw: {}, affected: 1 });

    await userController.delete(req as Request, res as Response);

    expect(mockUserRepository.delete).toHaveBeenCalled();

    expect(mockUserRepository.delete).toHaveBeenCalledWith(userID);

    expect(ResponseHandler.sendSuccessResponse).toHaveBeenCalledWith(
      res,
      'User Deleted',
      StatusCodes.OK
    );
  });

  //Update

  it('update returns a BAD_REQUEST if no information is provided', async () => {
    const req = mockRequest(); //Invalid/no id
    const res = mockResponse();

    await userController.update(req as Request, res as Response);

    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.BAD_REQUEST,
      UserController.ERROR_ID_NOT_FOUND
    );
  });

  it('UPDATE will return BAD_REQUEST if no ID was provided', async () => {
    const validManagerDetails = getValidManagerData();
    const req = mockRequest(
      {},
      {
        email: validManagerDetails.email,
        roleID: validManagerDetails.roleID,
        firstname: validManagerDetails.firstname,
        surname: validManagerDetails.surname,
        annualLeaveBalance: validManagerDetails.annualLeaveBalance,
      }
    );
    const res = mockResponse();

    const EXPECTED_ERROR_MESSAGE = VALIDATOR_CONSTRAINT_ID_MUST_BE_PROVIDED;
    jest.spyOn(classValidator, 'validate').mockResolvedValue([
      {
        property: 'userID',
        constraints: {
          IsDefined: VALIDATOR_CONSTRAINT_ID_MUST_BE_PROVIDED,
        },
      },
    ]);

    await userController.update(req as Request, res as Response);
    expect(ResponseHandler.sendErrorResponse).toHaveBeenCalledWith(
      res,
      StatusCodes.BAD_REQUEST,
      EXPECTED_ERROR_MESSAGE
    );
  });
});
