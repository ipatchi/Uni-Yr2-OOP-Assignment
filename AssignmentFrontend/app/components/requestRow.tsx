import { Form } from "react-router";
import type { LeaveRequest } from "~/types/leaveRequest";

export default function RequestRow({ request }: { request: LeaveRequest }) {
  return (
    <li key={request.leaveRequestID}>
      {`${request.leaveRequestID} - ${request.reason} - ${request.status} - ${request.startDate} to ${request.endDate}`}
      {request.status !== "Cancelled" && request.status !== "Rejected" && (
        <Form method="post">
          <input type="hidden" name="_action" value="cancelRequest" />
          <input
            type="hidden"
            name="leaveRequestID"
            value={request.leaveRequestID}
          />
          <button type="submit">Cancel</button>
        </Form>
      )}
    </li>
  );
}
