import { Repository } from 'typeorm';
import { User } from '../entity/User';
import { AppDataSource } from '../data-source';
import { ResponseHandler } from '../helpers/ResponseHandler';
import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import { validate } from 'class-validator';
import { instanceToPlain } from 'class-transformer';

export class UserController {
  private userRepository: Repository<User>;

  public static readonly ERROR_USER_WITH_ERROR_ID_NOT_FOUND = (id: number) =>
    `User with ID ${id} not found.`;
  public static readonly ERROR_EMAIL_IS_REQUIRED = `Email is required.`;
  public static readonly ERROR_EMAIL_NOT_FOUND = (email: string) =>
    `Email ${email} is not found.`;
  public static readonly ERROR_INVALID_ID_FORMAT = `Invalid ID format`;
  public static readonly ERROR_ID_NOT_FOUND = `ID not provided.`;
  public static readonly ERROR_FAILED_TO_RETRIEVE_USERS = `Failed to retrieve users`;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.userRepository.find({
        relations: ['roleID'],
      });

      if (users.length === 0) {
        ResponseHandler.sendErrorResponse(res, StatusCodes.NO_CONTENT);
        return;
      }

      ResponseHandler.sendSuccessResponse(res, users);
    } catch (error) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        UserController.ERROR_FAILED_TO_RETRIEVE_USERS
      );
    }
  };

  public getByEmail = async (req: Request, res: Response): Promise<void> => {
    const email = req.params.emailAddress;

    if (!email || email.trim().length === 0) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        UserController.ERROR_EMAIL_IS_REQUIRED
      );
      return;
    }

    try {
      const user = await this.userRepository.findOne({
        where: { email: email },
        relations: ['roleID'],
      });

      if (!user) {
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          UserController.ERROR_EMAIL_NOT_FOUND(email)
        );
        return;
      }

      ResponseHandler.sendSuccessResponse(res, user);
    } catch (error) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        UserController.ERROR_EMAIL_NOT_FOUND(email)
      );
    }
  };

  public getByID = async (req: Request, res: Response): Promise<void> => {
    const userID = parseInt(req.params.id);

    if (isNaN(userID)) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        UserController.ERROR_INVALID_ID_FORMAT
      );
      return;
    }

    try {
      const user = await this.userRepository.findOne({
        where: { userID: userID },
        relations: ['roleID'],
      });

      if (!user) {
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          UserController.ERROR_ID_NOT_FOUND
        );
        return;
      }

      ResponseHandler.sendSuccessResponse(res, user);
    } catch (error) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        `Error fetching user: ${error.message}`
      );
    }
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      let user = new User();
      user.password = req.body.password;
      user.email = req.body.email;
      user.firstname = req.body.firstname;
      user.surname = req.body.surname;
      user.roleID = req.body.roleID;
      user.annualLeaveBalance = req.body.annualLeaveBalance || 25;

      const errors = await validate(user);
      if (errors.length > 0) {
        throw new Error(
          errors.map((err) => Object.values(err.constraints || {})).join(', ')
        );
      }

      user = await this.userRepository.save(user);
      ResponseHandler.sendSuccessResponse(
        res,
        instanceToPlain(user),
        StatusCodes.CREATED
      );
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        error.message
      );
    }
  };

  public delete = async (req: Request, res: Response): Promise<void> => {
    console.log('Reached delete');
    const userID = parseInt(req.params.id);
    console.log(`Deleting userID: ${userID}`);
    try {
      if (!userID) {
        throw new Error(UserController.ERROR_ID_NOT_FOUND);
      }
      const result = await this.userRepository.delete(userID);

      if (result.affected === 0) {
        throw new Error(
          UserController.ERROR_USER_WITH_ERROR_ID_NOT_FOUND(userID)
        );
      }
      ResponseHandler.sendSuccessResponse(res, 'User Deleted', StatusCodes.OK);
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        error.message
      );
    }
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    const userID = req.body.id;
    try {
      if (!userID) {
        throw new Error(UserController.ERROR_ID_NOT_FOUND);
      }

      let user = await this.userRepository.findOneBy({ userID });

      if (!user) {
        throw new Error(
          UserController.ERROR_USER_WITH_ERROR_ID_NOT_FOUND(userID)
        );
      }

      user.email = req.body.email;
      user.roleID = req.body.roleID;
      user.firstname = req.body.firstname;
      user.surname = req.body.surname;
      user.annualLeaveBalance = req.body.annualLeaveBalance;

      const errors = await validate(user);

      if (errors.length > 0) {
        throw new Error(
          errors.map((err) => Object.values(err.constraints || {})).join(', ')
        );
      }

      user = await this.userRepository.save(user);
      ResponseHandler.sendSuccessResponse(
        res,
        instanceToPlain(user),
        StatusCodes.OK
      );
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        error.message
      );
    }
  };
}
