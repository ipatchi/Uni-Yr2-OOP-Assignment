import { Router } from "express";
import { ManagerController } from "../controllers/ManagerController";
import { authoriseRole } from "../helpers/AuthoriseRole";
import { RoleName } from "../types/RoleName";
import { Role } from "../entity/Role";

export class ManagerRouter {
  constructor(
    private router: Router,
    private managerController: ManagerController
  ) {
    this.addRoutes();
  }
  public getRouter(): Router {
    return this.router;
  }
  private addRoutes() {
    this.router.get(
      "/",
      authoriseRole(RoleName.ADMIN, RoleName.MANAGER),
      this.managerController.getAll
    );

    this.router.get(
      "/:userID",
      authoriseRole(RoleName.ADMIN, RoleName.MANAGER),
      this.managerController.getByUserID
    );
    this.router.post(
      "/",
      authoriseRole(RoleName.ADMIN),
      this.managerController.create
    );
    this.router.delete(
      "/:id",
      authoriseRole(RoleName.ADMIN),
      this.managerController.delete
    );
    this.router.patch(
      "/",
      authoriseRole(RoleName.ADMIN),
      this.managerController.updateManager
    );
  }
}
