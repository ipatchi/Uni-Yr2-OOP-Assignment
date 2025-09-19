import { Form } from "react-router";
import type { LeaveRequest } from "~/types/leaveRequest";

export default function RequestRow({
  request,
  userID,
}: {
  request: LeaveRequest;
  userID: string;
}) {
  return (
    <li key={request.leaveRequestID}>
      {`${request.startDate} to ${request.endDate} - ${request.reason} - ${request.status}`}
      {request.status === "Pending" && (
        <>
          <Form method="post">
            <input type="hidden" name="_action" value="approveRequest" />
            <input type="text" name="reason" />
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
            <input type="text" name="reason" />
            <input type="hidden" name="userID" value={userID} />
            <input
              type="hidden"
              name="leaveRequestID"
              value={request.leaveRequestID}
            />
            <button type="submit">Reject</button>
          </Form>
        </>
      )}
    </li>
  );
}
