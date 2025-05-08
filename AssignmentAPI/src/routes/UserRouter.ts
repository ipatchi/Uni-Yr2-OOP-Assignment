import { UserController } from '../controllers/UserController';
import { Router } from 'express';

export class UserRouter {
  constructor(private router: Router, private userController: UserController) {
    this.addRoutes();
  }

  public getRouter(): Router {
    return this.router;
  }

  private addRoutes() {
    this.router.delete('/:id', this.userController.delete);
    this.router.get('/', this.userController.getAll);
    this.router.get('/email/:emailAddress', this.userController.getByEmail);
    this.router.get('/:id', this.userController.getByID);
    this.router.post('/', this.userController.create);
    this.router.patch('/', this.userController.update);
  }
}
