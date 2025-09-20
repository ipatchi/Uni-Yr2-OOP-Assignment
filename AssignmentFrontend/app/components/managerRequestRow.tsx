import { Form } from "react-router";
import type { LeaveRequest } from "~/types/leaveRequest";

export default function RequestRow({
  request,
  userID,
}: {
  request: LeaveRequest;
  userID: string;
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB");
  };
  return (
    <li key={request.leaveRequestID} className="request-row">
      <span className="request-cell dates">{`${formatDate(request.startDate)} - ${formatDate(request.endDate)}`}</span>
      <span className="request-cell reason">{request.reason}</span>
      <span className="request-cell status">{request.status}</span>
      {request.status === "Pending" && (
        <div className="request-actions">
          <Form method="post">
            <input type="hidden" name="_action" value="approveRequest" />
            <input type="text" name="reason" placeholder="Approval Reason..." />
            <input type="hidden" name="userID" value={userID} />
            <input
              type="hidden"
              name="leaveRequestID"
              value={request.leaveRequestID}
            />
            <button type="submit">Approve</button>
          </Form>
          <Form method="post">
            <input type="hidden" name="_action" value="rejectRequest" />
            <input
              type="text"
              name="reason"
              placeholder="Rejection Reason..."
            />
            <input type="hidden" name="userID" value={userID} />
            <input
              type="hidden"
              name="leaveRequestID"
              value={request.leaveRequestID}
            />
            <button type="submit" className="destructive">
              Reject
            </button>
          </Form>
        </div>
      )}
    </li>
  );
}
