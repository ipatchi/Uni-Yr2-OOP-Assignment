export type LeaveRequest = {
  leaveRequestID: number;
  startDate: string;
  endDate: string;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string, optional
  reason: string;
};
