import { Router } from 'express';
import { RoleController } from '../controllers/RoleController';
export class RoleRouter {
  constructor(private router: Router, private roleController: RoleController) {
    this.addRoutes();
  }
  public getRouter(): Router {
    return this.router;
  }
  private addRoutes() {
    this.router.get('/', this.roleController.getAll);
    this.router.get('/:id', this.roleController.getById);
    this.router.post('/', this.roleController.create);
    this.router.delete('/:id', this.roleController.delete);
    this.router.patch('/', this.roleController.update);
  }
}
