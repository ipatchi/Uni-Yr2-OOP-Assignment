import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Role } from "../entity/Role";
import { Repository } from "typeorm";
import { StatusCodes } from "http-status-codes";
import { ResponseHandler } from "../helpers/ResponseHandler";
import { validate } from "class-validator";

export class RoleController {
  public static readonly ERROR_NO_ID_PROVIDED = "No ID provided";
  public static readonly ERROR_INVALID_ID_FORMAT = "Invalid ID format";
  public static readonly ERROR_ROLE_NOT_FOUND = "Role not found";
  public static readonly ERROR_ROLE_NOT_FOUND_WITH_ID = (id: number) =>
    `Role not found with ID ${id}`;
  public static readonly ERROR_NAME_IS_BLANK = "Name is required";
  public static readonly ERROR_FAILED_TO_RETRIEVE_ROLES =
    "Failed to retrieve roles";
  public static readonly ERROR_FAILED_TO_RETRIEVE_ROLE =
    "Failed to retrieve role";
  public static readonly ERROR_ROLE_NOT_FOUND_FOR_DELETION =
    "Role with provided ID not found";

  private roleRepository: Repository<Role>;

  constructor() {
    this.roleRepository = AppDataSource.getRepository(Role);
  }
  // Get all users

  // Get Role by ID
  public getById = async (req: Request, res: Response): Promise<void> => {
    const roleID = parseInt(req.params.roleID);
    if (isNaN(roleID)) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        RoleController.ERROR_INVALID_ID_FORMAT,
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
          RoleController.ERROR_ROLE_NOT_FOUND_WITH_ID(roleID),
        );
        return;
      }
      ResponseHandler.sendSuccessResponse(res, role);
    } catch (error) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        RoleController.ERROR_FAILED_TO_RETRIEVE_ROLE,
      );
    }
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      let role = new Role();
      role.name = req.body.name;

      const errors = await validate(role);

      if (errors.length > 0) {
        throw new Error(
          errors.map((err) => Object.values(err.constraints || {})).join(", "),
        );
      }

      role = await this.roleRepository.save(role);
      ResponseHandler.sendSuccessResponse(res, role, StatusCodes.CREATED);
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        error.message,
      );
    }
  };

  public delete = async (req: Request, res: Response) => {
    const roleID = parseInt(req.params.roleID);

    try {
      if (!roleID) {
        throw new Error(RoleController.ERROR_NO_ID_PROVIDED);
      }
      const result = await this.roleRepository.delete(roleID);
      if (result.affected === 0) {
        throw new Error(RoleController.ERROR_ROLE_NOT_FOUND_WITH_ID(roleID));
      }

      ResponseHandler.sendSuccessResponse(res, "Role Deleted");
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        error.message,
      );
    }
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    const roleID = req.body.roleID;

    try {
      let role = await this.roleRepository.findOneBy({ roleID });

      if (!role) {
        throw new Error(RoleController.ERROR_ROLE_NOT_FOUND);
      }

      role.name = req.body.name;
      const errors = await validate(role);
      if (errors.length > 0) {
        throw new Error(RoleController.ERROR_NAME_IS_BLANK);
      }

      role = await this.roleRepository.save(role);
      ResponseHandler.sendSuccessResponse(res, role, StatusCodes.OK);
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        error.message,
      );
    }
  };
}
