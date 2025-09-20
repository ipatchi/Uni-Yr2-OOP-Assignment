import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
} from "react-router";
import { getToken, getUserID, getUserRole } from "~/sessions.server";
import { useEffect, useState } from "react";
import type { LeaveRequest } from "~/types/leaveRequest";
import ManagerRequestRow from "~/components/managerRequestRow";
import type { Route } from "../+types/login";
import type { User } from "~/types/user";
import NavigationBar from "~/components/navigationBar";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Leave Request - Admin Hub" },
    {
      name: "description",
      content: "This is the admin system for the leave request application.",
    },
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
  if (Number(role) !== 1) {
    return redirect("/home");
  }

  const employees = await fetch(`http://localhost:8900/api/users`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!employees.ok) {
    console.error("Failed to fetch all employees");
    return redirect("/home");
  }

  const employeeData = (await employees.json()).data;

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
      return { error: "All fields are required." };
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
      return { error: "Failed to Approve: " + (await response.text()) };
    } else {
      return redirect("/admin");
    }
  }
  if (intent === "rejectRequest") {
    const leaveRequestID = formData.get("leaveRequestID");
    const reason = formData.get("reason");
    const userID = formData.get("userID");
    if (!leaveRequestID || !reason || !userID) {
      return {
        error:
          "Leave Request ID, reason, and userID are required to reject a request",
      };
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
      return {
        error: "Failed to reject leave request: " + (await response.text()),
      };
    } else {
      return redirect("/admin");
    }
  }
}

export default function Admin() {
  const { token, userID, role, employeeData } = useLoaderData<LoaderData>();

  const [selectedEmployeeID, setSelectedEmployeeID] = useState("");
  const [selectedEmployeeData, setSelectedEmployeeData] = useState<User>();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveRemaining, setLeaveRemaining] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedEmployeeID) {
      setError("Please select an employee to view their requests.");
    } else {
      setError(null);
    }
    setLeaveRequests([]);
    setLeaveRemaining(0);
    setSelectedEmployeeData(undefined);

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
          setError("Failed to fetch leave requests");
          return redirect("/home");
        }
        const requests = (await reqsResponse.json()).data;

        setLeaveRequests(requests);
      } catch (error) {
        setError("Loading error: " + error);
        return redirect("/home");
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
        if (!reqsResponse.ok) {
          console.error("Failed to fetch employee data");
          setError("Failed to fetch employee data");
          return redirect("/home");
        }
        const data = (await reqsResponse.json()).data;

        setLeaveRemaining(data.annualLeaveBalance);
        setSelectedEmployeeData(data);
      } catch (error) {
        console.log("Error fetching employee data:", error);
        setError("Loading Error: " + error);
        return redirect("/home");
      }
    };

    fetchLeaveRequests();
    fetchEmployeeData();
    setIsLoading(false);
  }, [selectedEmployeeID, token]);

  const handleEmployeeChange = (newID: string) => {
    setSelectedEmployeeID(newID);
  };

  const actionData = useActionData<typeof action>();

  return (
    <>
      <NavigationBar role={role} />
      <h2>Admin Dashboard:</h2>

      <h3>Employees:</h3>
      <div className="horizontal-container">
        <Form method="get" action="/admin/new-user">
          <button type="submit">Add New User</button>
        </Form>
      </div>
      <label htmlFor="employeeSelect">Select an Employee:</label>
      <div className="select-wrapper">
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
      </div>
      {error && <p className="error">{error}</p>}
      {actionData?.error && <p className="error">{actionData.error}</p>}
      {selectedEmployeeData && (
        <div className="info-box">
          {selectedEmployeeID && (
            <Form
              method="get"
              action={`/admin/edit-user/${selectedEmployeeID}`}
            >
              <button type="submit">Edit User</button>
            </Form>
          )}
          <p>Leave Remaining: {leaveRemaining} days</p>
          <p>Role: {selectedEmployeeData?.roleID?.name || "Unknown"}</p>
        </div>
      )}
      <div>
        {isLoading && <p>Loading...</p>}

        {!isLoading && leaveRequests.length === 0 && (
          <p>User has no leave requests.</p>
        )}
        {!isLoading && leaveRequests.length > 0 && (
          <>
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
          </>
        )}
      </div>
    </>
  );
}
