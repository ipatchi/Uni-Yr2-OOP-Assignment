export type User = {
  userID: number;
  firstname: string;
  surname: string;
  email: string;
  annualLeaveBalance: number;
  roleID: {
    roleID: number;
    name: string;
  };
};
