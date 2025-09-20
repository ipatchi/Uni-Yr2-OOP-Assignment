import { Form, redirect, useLoaderData } from "react-router";
import type { Route } from "./+types/login";
import { getToken, getUserID, getUserRole } from "~/sessions.server";
import { useEffect, useState } from "react";
import type { LeaveRequest } from "~/types/leaveRequest";
import ManagerRequestRow from "~/components/managerRequestRow";
import NavigationBar from "~/components/navigationBar";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Leave Request - Manager Hub" },
    { name: "description", content: "Welcome to the Leave Request system!" },
  ];
}

type LoaderData = {
  token: string;
  userID: string;
  role: number;
  employeeData: any[];
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

  const employees = await fetch(`http://localhost:8900/api/managers`, {
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

  return { token, userID, role, employeeData };
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
      `http://localhost:8900/api/leave-requests/approve`,
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
      `http://localhost:8900/api/leave-requests/reject`,
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
  const { token, userID, role, employeeData } = useLoaderData<LoaderData>();

  const [selectedEmployeeID, setSelectedEmployeeID] = useState("");
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveRemaining, setLeaveRemaining] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedEmployeeID) {
      return;
    }
    console.log("Selected Employee ID:", selectedEmployeeID);

    const fetchLeaveRequests = async () => {
      setIsLoading(true);
      try {
        const reqsResponse = await fetch(
          `http://localhost:8900/api/leave-requests/status/${selectedEmployeeID}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!reqsResponse.ok) {
          console.error("Failed to fetch leave requests");
        }
        const requests = (await reqsResponse.json()).data;

        setLeaveRequests(requests);
      } catch (error) {
        console.error("Loading error: " + error);
      }
    };
    const fetchLeaveRemaining = async () => {
      setIsLoading(true);
      try {
        const reqsResponse = await fetch(
          `http://localhost:8900/api/leave-requests/remaining/${selectedEmployeeID}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const balance = reqsResponse.ok
          ? (await reqsResponse.json()).data.leaveBalance
          : 0;
        if (!reqsResponse.ok) {
          console.error("Failed to fetch leave balance");
        }
        setLeaveRemaining(balance);
      } catch (error) {
        console.error("Loading error: " + error);
      }
    };

    fetchLeaveRequests();
    fetchLeaveRemaining();
    setIsLoading(false);
  }, [selectedEmployeeID, token]);

  const handleEmployeeChange = (newID: string) => {
    setSelectedEmployeeID(newID);
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
        <p>Leave Remaining: {leaveRemaining} days</p>
        {!isLoading &&
          (!leaveRequests || (leaveRequests && leaveRequests.length === 0)) && (
            <p className="error">No leave requests found.</p>
          )}
        {!isLoading && leaveRequests.length > 0 && (
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
                  userID={selectedEmployeeID}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
