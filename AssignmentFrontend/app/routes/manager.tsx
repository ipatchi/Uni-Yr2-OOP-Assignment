import { Form, redirect, useLoaderData, useSubmit } from "react-router";
import type { Route } from "./+types/login";
import { getToken, getUserID, getUserRole } from "~/sessions.server";
import { useEffect, useState } from "react";
import type { LeaveRequest } from "~/types/leaveRequest";
import ManagerRequestRow from "~/components/managerRequestRow";
import NavigationBar from "~/components/navigationBar";
import type { User } from "~/types/user";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Leave Request - Manager Hub" },
    { name: "description", content: "Manage Employees" },
  ];
}

type LoaderData = {
  token: string;
  userID: string;
  role: number;
  employeeData: any[];
  selectedEmployeeData?: User;
  selectedEmployeeID?: number;
  leaveRequests?: LeaveRequest[];
};

export async function loader({ request }: Route.LoaderArgs) {
  const token = await getToken(request);
  const userID = await getUserID(request);
  const role = await getUserRole(request);
  if (!token || !userID || !role) {
    return redirect("/");
  }
  if (Number(role) !== 1 && Number(role) !== 2) {
    return redirect("/home");
  }

  const employees = await fetch(`${process.env.VITE_API_URL}/api/managers`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!employees.ok) {
    console.error("Failed to fetch all employees");
    return redirect("/home");
  }

  const employeeData = (await employees.json()).data.filter(
    (employee: any) => employee.managerID.userID === userID
  );

  const searchParams = new URL(request.url).searchParams;
  const selectedEmployeeID = searchParams.get("employeeID");
  let selectedEmployeeData = null;
  let leaveRequests: LeaveRequest[] = [];
  if (selectedEmployeeID) {
    const reqsResponse = await fetch(
      `${process.env.VITE_API_URL}/api/leave-requests/status/${selectedEmployeeID}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (reqsResponse.ok) {
      leaveRequests = (await reqsResponse.json()).data;
    }
    const userResponse = await fetch(
      `${process.env.VITE_API_URL}/api/users/${selectedEmployeeID}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (userResponse.ok) {
      selectedEmployeeData = (await userResponse.json()).data;
    }
  }

  return {
    token,
    userID,
    role,
    employeeData,
    selectedEmployeeData,
    selectedEmployeeID: selectedEmployeeID
      ? Number(selectedEmployeeID)
      : undefined,
    leaveRequests,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const token = await getToken(request);
  if (!token) {
    return redirect("/");
  }

  const intent = formData.get("_action");

  if (intent === "approveRequest") {
    const leaveRequestID = formData.get("leaveRequestID");
    const reason = formData.get("reason");
    const userID = formData.get("userID");
    if (!leaveRequestID || !reason || !userID) {
      console.error(
        "Leave Request ID, reason, and userID are required to approve a request"
      );
      return null;
    }

    const response = await fetch(
      `${process.env.VITE_API_URL}/api/leave-requests/approve`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          leaveRequestID: leaveRequestID,
          userID: userID,
          reason: reason,
        }),
      }
    );
    if (!response.ok) {
      console.error("Failed to approve leave request", await response.text());
      return null;
    } else {
      return redirect("/manager");
    }
  }
  if (intent === "rejectRequest") {
    const leaveRequestID = formData.get("leaveRequestID");
    const reason = formData.get("reason");
    const userID = formData.get("userID");
    console.log("Rejecting request:", { leaveRequestID, reason, userID });
    if (!leaveRequestID || !reason || !userID) {
      console.error(
        "Leave Request ID, reason, and userID are required to reject a request"
      );
      return null;
    }

    const response = await fetch(
      `${process.env.VITE_API_URL}/api/leave-requests/reject`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          leaveRequestID: leaveRequestID,
          userID: userID,
          reason: reason,
        }),
      }
    );
    if (!response.ok) {
      console.error("Failed to reject leave request", await response.text());
      return null;
    } else {
      return redirect("/manager");
    }
  }
}

export default function Manager() {
  const {
    token,
    userID,
    role,
    employeeData,
    selectedEmployeeData,
    selectedEmployeeID,
    leaveRequests,
  } = useLoaderData<LoaderData>();
  const [isLoading, setIsLoading] = useState(false);
  const submit = useSubmit();

  useEffect(() => {
    if (!selectedEmployeeID) {
      return;
    }

    setIsLoading(false);
  }, [selectedEmployeeID, token]);

  const handleEmployeeChange = (newID: string) => {
    submit({ employeeID: newID }, { method: "get", action: "/manager" });
  };

  return (
    <>
      <NavigationBar role={role} />
      <h2>Manage Employees</h2>

      <h3>Leave Requests:</h3>
      <label htmlFor="employeeSelect">Select an Employee:</label>
      <div className="select-wrapper">
        <select
          id="employeeSelect"
          value={selectedEmployeeID}
          onChange={(e) => handleEmployeeChange(e.target.value)}
        >
          <option value="">Select an Employee</option>
          {employeeData.map((employee) => (
            <option key={employee.userID.userID} value={employee.userID.userID}>
              {`${employee.userID.firstname} ${employee.userID.surname}`}
            </option>
          ))}
        </select>
      </div>

      <div>
        {isLoading && <p>Loading...</p>}
        <p>
          Leave Remaining:{" "}
          {selectedEmployeeData
            ? selectedEmployeeData.annualLeaveBalance
            : "Unknown"}{" "}
          days
        </p>
        {!isLoading &&
          (!leaveRequests || (leaveRequests && leaveRequests.length === 0)) && (
            <p className="error">No leave requests found.</p>
          )}
        {!isLoading && leaveRequests && leaveRequests.length > 0 && (
          <div>
            <ul>
              <li className="request-header">
                <span className="request-cell">Dates</span>
                <span className="request-cell">Reason</span>
                <span className="request-cell">Status</span>
                <span className="request-cell">Actions</span>
              </li>
              {leaveRequests.map((request) => (
                <ManagerRequestRow
                  request={request}
                  userID={Number(selectedEmployeeID)}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
