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
        `Failed to retrieve users: ${error.message}`
      );
    }
  };

  public getByEmail = async (req: Request, res: Response): Promise<void> => {
    const email = req.params.emailAddress;

    if (!email || email.trim().length === 0) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        'Email is required'
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
          `${email} not found`
        );
        return;
      }

      ResponseHandler.sendSuccessResponse(res, user);
    } catch (error) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        `Unable to find user with the email: ${email}`
      );
    }
  };

  public getByID = async (req: Request, res: Response): Promise<void> => {
    const userID = parseInt(req.params.id);

    if (isNaN(userID)) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        'Invalid ID format'
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
          `$User with ID: ${userID} not found`
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
    const userID = parseInt(req.params.id);

    try {
      if (!userID) {
        throw new Error('No ID provided');
      }
      const result = await this.userRepository.delete(userID);

      if (result.affected === 0) {
        throw new Error('User with the provided ID not found');
      }
      ResponseHandler.sendSuccessResponse(res, 'User Deleted', StatusCodes.OK);
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        error.message
      );
    }
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    const userID = req.body.id;
    try {
      if (!userID) {
        throw new Error('No ID Provided!');
      }

      let user = await this.userRepository.findOneBy({ userID });

      if (!user) {
        throw new Error('User not found.');
      }

      user.email = req.body.email;
      user.roleID = req.body.roleID;
      user.firstname = req.body.firstname;
      user.surname = req.body.surname;

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
