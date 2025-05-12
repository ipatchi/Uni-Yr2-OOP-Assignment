import { Router } from 'express';
import { LoginController } from '../controllers/LoginController';

export class LoginRouter {
  constructor(
    private router: Router,
    private loginController: LoginController
  ) {
    this.addRoutes();
  }

  public getRouter(): Router {
    return this.router;
  }

  public addRoutes() {
    this.router.post('/', this.loginController.login);
  }
}
