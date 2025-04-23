import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import { Role } from '../entity/Role';

export class RoleController {
  private roleRepository: Repository<Role>;

  constructor() {
    this.roleRepository = AppDataSource.getRepository(Role);
  }

  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const roles = await this.roleRepository.find();
      if (roles.length === 0) {
        res.status(StatusCodes.NO_CONTENT);
        return;
      }
      res.send(roles);
    } catch {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send('Failed to retrieve roles');
    }
  };

  public getByID = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(StatusCodes.BAD_REQUEST).send('Invalid ID format');
      return;
    }

    try {
      const role = await this.roleRepository.findOne({ where: { id: id } });
      if (!role) {
        res.status(StatusCodes.NOT_FOUND).send(`Role not found with id ${id}`);
        return;
      }
      res.status(StatusCodes.OK).send(role);
    } catch (error) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send('Failed to retrieve role');
    }
  };
}
