import { UserController } from '../controllers/UserController';
import { Router } from 'express';
import { authoriseRole } from '../helpers/AuthoriseRole';
import { RoleName } from '../types/RoleName';

export class UserRouter {
  constructor(private router: Router, private userController: UserController) {
    this.addRoutes();
  }

  public getRouter(): Router {
    return this.router;
  }

  private addRoutes() {
    this.router.delete(
      '/:id',
      authoriseRole(RoleName.ADMIN),
      this.userController.delete
    );
    this.router.get(
      '/',
      authoriseRole(RoleName.ADMIN),
      this.userController.getAll
    );
    this.router.get(
      '/email/:emailAddress',
      authoriseRole(RoleName.ADMIN),
      this.userController.getByEmail
    );
    this.router.get(
      '/:id',
      authoriseRole(RoleName.ADMIN),
      this.userController.getByID
    );
    this.router.post(
      '/',
      authoriseRole(RoleName.ADMIN),
      this.userController.create
    );
    this.router.patch(
      '/',
      authoriseRole(RoleName.ADMIN),
      this.userController.update
    );
  }
}
