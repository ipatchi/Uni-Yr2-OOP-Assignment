import { Form, Link, redirect, useLoaderData } from "react-router";
import { getToken, getUserID, getUserRole } from "~/sessions.server";
import { useEffect, useState } from "react";
import type { LeaveRequest } from "~/types/leaveRequest";
import ManagerRequestRow from "~/components/managerRequestRow";
import type { Route } from "../+types/login";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Leave Request - Admin Hub" },
    { name: "description", content: "Welcome to the Leave Request system!" },
  ];
}

type LoaderData = {
  token: string;
  userID: string;
  role: string;
  employeeData: any[];
};

export async function loader({ request }: Route.LoaderArgs) {
  const token = await getToken(request);
  const userID = await getUserID(request);
  const role = await getUserRole(request);
  if (!token || !userID || !role) {
    return redirect("/");
  }
  if (Number(role) !== 1) {
    return redirect("/home");
  }

  const employees = await fetch(`http://localhost:8900/api/users`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const employeeData = employees.ok ? (await employees.json()).data : [];

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
    }
  }
}

export default function Manager() {
  const { token, userID, role, employeeData } = useLoaderData<LoaderData>();

  const [selectedEmployeeID, setSelectedEmployeeID] = useState("");
  const [selectedEmployeeData, setSelectedEmployeeData] = useState<any>(null);
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
        const requests = reqsResponse.ok
          ? (await reqsResponse.json()).data
          : [];
        if (!reqsResponse.ok) {
          console.error("Failed to fetch leave requests");
        }
        setLeaveRequests(requests);
      } catch (error) {
        console.error("Loading error: " + error);
      }
    };
    const fetchEmployeeData = async () => {
      setIsLoading(true);
      try {
        const reqsResponse = await fetch(
          `http://localhost:8900/api/users/${selectedEmployeeID}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = reqsResponse.ok ? (await reqsResponse.json()).data : 0;
        if (!reqsResponse.ok) {
          console.error("Failed to fetch employee data");
        }
        setLeaveRemaining(data.annualLeaveBalance);
        setSelectedEmployeeData(data);
      } catch (error) {
        console.error("Loading error: " + error);
      }
    };

    fetchLeaveRequests();
    fetchEmployeeData();
    setIsLoading(false);
  }, [selectedEmployeeID, token]);

  const handleEmployeeChange = (newID: string) => {
    setSelectedEmployeeID(newID);
  };

  return (
    <>
      <h1>Manage Employees</h1>

      <h2>Leave Requests:</h2>
      <label>Select an Employee:</label>
      <select
        id="employeeSelect"
        value={selectedEmployeeID}
        onChange={(e) => handleEmployeeChange(e.target.value)}
      >
        <option value="">Select an Employee</option>
        {employeeData.map((employee) => (
          <option key={employee.userID} value={employee.userID}>
            {`${employee.firstname} ${employee.surname} - ${employee.userID}`}
          </option>
        ))}
      </select>
      {selectedEmployeeData && (
        <>
          <p>Leave Remaining: {leaveRemaining} days</p>
          <p>Role: {selectedEmployeeData.roleID.name}</p>
          <Link to={`/admin/edit-user/${selectedEmployeeID}`}>Edit User</Link>
        </>
      )}
      <div>
        {isLoading && <p>Loading...</p>}

        {!isLoading && leaveRequests.length === 0 && (
          <p>No leave requests found.</p>
        )}
        {!isLoading && leaveRequests.length > 0 && (
          <>
            <ul>
              {leaveRequests.map((request) => (
                <li key={request.leaveRequestID}>
                  <ManagerRequestRow
                    request={request}
                    userID={selectedEmployeeID}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <h2>Actions:</h2>

      <Form action="/logout" method="post">
        <button type="submit">Logout</button>
      </Form>
      <Form action="/home" method="post">
        <button type="submit">Home</button>
      </Form>
    </>
  );
}
