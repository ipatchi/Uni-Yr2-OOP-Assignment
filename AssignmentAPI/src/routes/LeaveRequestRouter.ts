import { Router } from 'express';
import { LeaveRequestController } from '../controllers/LeaveRequestController';
import { authoriseRole } from '../helpers/AuthoriseRole';
import { Role } from '../entity/Role';
import { RoleName } from '../types/RoleName';

export class LeaveRequestRouter {
  constructor(
    private router: Router,
    private leaveRequestController: LeaveRequestController
  ) {
    this.addRoutes();
  }
  public getRouter(): Router {
    return this.router;
  }
  private addRoutes() {
    this.router.post('/', this.leaveRequestController.addLeave);
    this.router.delete('/', this.leaveRequestController.cancelLeave);
    this.router.get('/status/:userID', this.leaveRequestController.getStatus);
    this.router.get(
      '/remaining/:userID',
      this.leaveRequestController.getBalance
    );
    this.router.patch(
      '/approve',
      authoriseRole(RoleName.MANAGER, RoleName.ADMIN),
      this.leaveRequestController.approveLeave
    );
    this.router.patch(
      '/reject',
      authoriseRole(RoleName.MANAGER, RoleName.ADMIN),
      this.leaveRequestController.rejectLeave
    );
  }
}
