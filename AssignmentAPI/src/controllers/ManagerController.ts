import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { ResponseHandler } from '../helpers/ResponseHandler';
import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import { validate } from 'class-validator';
import { instanceToPlain } from 'class-transformer';
import { Manager } from '../entity/Manager';
import { User } from '../entity/User';

export class ManagerController {
  private managerRepository: Repository<Manager>;

  constructor() {
    this.managerRepository = AppDataSource.getRepository(Manager);
  }

  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const managerPairs = await this.managerRepository.find({
        relations: ['userID', 'managerID'],
      });

      if (managerPairs.length === 0) {
        ResponseHandler.sendErrorResponse(res, StatusCodes.NO_CONTENT);
        return;
      }

      ResponseHandler.sendSuccessResponse(res, managerPairs);
    } catch (error) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Failed to retrieve managers: ${error.message}`
      );
    }
  };

  public getByUserID = async (req: Request, res: Response): Promise<void> => {
    const uID = parseInt(req.params.userID);

    if (isNaN(uID)) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        'Invalid ID format'
      );
      return;
    }

    try {
      const managerPair = await this.managerRepository
        .createQueryBuilder('m')
        .where('m.userID = :uID', { uID })
        .leftJoinAndSelect('m.managerID', 'mgr')
        .getOne();

      if (!managerPair) {
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          `Manager for user ID: ${uID} not found`
        );
        return;
      }

      ResponseHandler.sendSuccessResponse(res, managerPair);
    } catch (error) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        `Error fetching manager pair: ${error.message}`
      );
    }
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      let managerPair = new Manager();
      managerPair.managerID = req.body.managerID;
      managerPair.userID = req.body.userID;
      const errors = await validate(managerPair);
      if (errors.length > 0) {
        throw new Error(
          errors.map((err) => Object.values(err.constraints || {})).join(', ')
        );
      }
      managerPair = await this.managerRepository.save(managerPair);
      ResponseHandler.sendSuccessResponse(
        res,
        instanceToPlain(managerPair),
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
    const managerPairID = parseInt(req.params.id);

    try {
      if (!managerPairID) {
        throw new Error('No ID provided');
      }
      const result = await this.managerRepository.delete(managerPairID);

      if (result.affected === 0) {
        throw new Error('Manager pair with the provided ID not found');
      }
      ResponseHandler.sendSuccessResponse(
        res,
        'Manager Pair Deleted',
        StatusCodes.OK
      );
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        error.message
      );
    }
  };

  public updateManager = async (req: Request, res: Response): Promise<void> => {
    const userID = req.body.userID;
    const managerID = req.body.managerID;
    try {
      if (!userID) {
        throw new Error('No userID Provided!');
      }

      let managerPair = await this.managerRepository.findOne({
        where: { userID: userID },
        relations: ['userID', 'managerID'],
      });

      if (!managerPair) {
        throw new Error('Manager could not be found for user.');
      }

      if (!managerID) {
        throw new Error('No managerID Provided!');
      }

      managerPair.managerID = managerID;

      const errors = await validate(managerPair);

      if (errors.length > 0) {
        throw new Error(
          errors.map((err) => Object.values(err.constraints || {})).join(', ')
        );
      }

      managerPair = await this.managerRepository.save(managerPair);
      ResponseHandler.sendSuccessResponse(
        res,
        instanceToPlain(managerPair),
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
