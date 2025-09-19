export type Management = {
  id: number;
  userID: number;
  managerID: {
    userID: number;
    firstname: string;
    surname: string;
    email: string;
    annualLeaveBalance: number;
  };
};
