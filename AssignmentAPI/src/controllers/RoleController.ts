import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Role } from '../entity/Role';
import { Repository } from 'typeorm';
import { StatusCodes } from 'http-status-codes';
import { ResponseHandler } from '../helpers/ResponseHandler';
import { validate } from 'class-validator';

export class RoleController {
  private roleRepository: Repository<Role>;
  constructor() {
    this.roleRepository = AppDataSource.getRepository(Role);
  }
  // Get all users
  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const roles = await this.roleRepository.find();
      if (roles.length === 0) {
        ResponseHandler.sendErrorResponse(res, StatusCodes.NO_CONTENT);
        return;
      }
      res.send(roles);
    } catch (error) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to retrieve roles'
      );
    }
  };

  // Get Role by ID
  public getById = async (req: Request, res: Response): Promise<void> => {
    const roleID = parseInt(req.params.id);
    if (isNaN(roleID)) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        'Invalid ID format'
      );
      return;
    }
    try {
      const role = await this.roleRepository.findOne({
        where: { roleID: roleID },
      });
      if (!role) {
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.NOT_FOUND,
          `Role not found with ID: ${roleID}`
        );
        return;
      }
      ResponseHandler.sendSuccessResponse(res, role);
    } catch (error) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to retrieve role'
      );
    }
  };

  public create = async (req: Request, res: Response) => {
    try {
      let role = new Role();
      role.name = req.body.name;

      const errors = await validate(role);
      if (errors.length > 0) {
        throw new Error('Name is blank');
      }

      role = await this.roleRepository.save(role);
      ResponseHandler.sendSuccessResponse(res, role, StatusCodes.CREATED);
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        error.message
      );
    }
  };

  public delete = async (req: Request, res: Response) => {
    const roleID = req.params.id;

    try {
      if (!roleID) {
        throw new Error('No ID Provided!');
      }
      const result = await this.roleRepository.delete(roleID);
      if (result.affected === 0) {
        throw new Error('Role with provided ID could not be found');
      }

      ResponseHandler.sendSuccessResponse(res, 'Role Deleted');
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        error.message
      );
    }
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    const roleID = req.body.id;

    try {
      let role = await this.roleRepository.findOneBy({ roleID });

      if (!role) {
        throw new Error('Role not found');
      }

      role.name = req.body.name;
      const errors = await validate(role);
      if (errors.length > 0) {
        throw new Error('Name is blank!');
      }

      role = await this.roleRepository.save(role);
      ResponseHandler.sendSuccessResponse(res, role);
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        error.message
      );
    }
  };
}
