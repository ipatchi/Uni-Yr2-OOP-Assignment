import { Form, redirect, useActionData, useLoaderData } from "react-router";
import type { Route } from "../+types/login";
import { getToken, getUserID, getUserRole } from "~/sessions.server";
import type { User } from "~/types/user";
import type { Management } from "~/types/management";
import { useState } from "react";
import NavigationBar from "~/components/navigationBar";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Leave Request - Admin - Edit User" },
    { name: "description", content: "Edit a user" },
  ];
}

interface LoaderArgs extends Route.LoaderArgs {
  params: {
    employeeID: string;
  };
}

type LoaderData = {
  token: string;
  userID: string;
  role: number;
  employeeData: User;
  employeeManagerData: Management;
  allManagersData: User[];
};

export async function loader({ request, params }: LoaderArgs) {
  console.log("Attempting to load edit user page");
  const token = await getToken(request);
  const userID = await getUserID(request);
  const role = await getUserRole(request);
  if (!token || !userID || !role) {
    return redirect("/");
  }
  if (Number(role) !== 1) {
    return redirect("/home");
  }
  const employeeID = params.employeeID;
  if (!employeeID) {
    console.log("No employeeID provided in params");
    return redirect("/admin");
  }

  const employee = await fetch(
    `http://localhost:8900/api/users/${employeeID}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!employee.ok) {
    console.log("Failed to fetch employee data");
    return redirect("/admin");
  }

  const employeeData = (await employee.json()).data;

  const employeesManager = await fetch(
    `http://localhost:8900/api/managers/${employeeID}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  let employeeManagerData: Management | null = null;
  if (!employeesManager.ok) {
    console.log("Failed to fetch employee's manager data");
    employeeManagerData = null;
  } else {
    employeeManagerData = (await employeesManager.json()).data;
  }

  const allManagers = await fetch(`http://localhost:8900/api/users`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!allManagers.ok) {
    console.log("Failed to fetch all user data");
    return redirect("/admin");
  }

  const allManagersData = (await allManagers.json()).data.filter(
    (user: User) =>
      user.roleID.name === "Manager" || user.roleID.name === "Admin"
  );

  return {
    token,
    userID,
    role,
    employeeData,
    employeeManagerData,
    allManagersData,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const employeeID = formData.get("userID");
  const email = formData.get("email");
  const firstname = formData.get("firstname");
  const surname = formData.get("surname");
  const roleID = formData.get("roleID");
  const managerID = formData.get("managerID");
  const leaveBalance = Number(formData.get("leaveBalance"));

  const token = await getToken(request);
  if (!token) {
    return redirect("/");
  }
  if (
    !roleID ||
    !managerID ||
    !leaveBalance ||
    !employeeID ||
    !email ||
    !firstname ||
    !surname
  ) {
    return { error: "All fields are required." };
  }
  console.log("Leave balance to set:", Number(leaveBalance));

  try {
    const response = await fetch("http://localhost:8900/api/users", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: employeeID,
        email: email,
        roleID: roleID,
        firstname: firstname,
        surname: surname,
        annualLeaveBalance: Number(leaveBalance),
      }),
    });
    if (!response.ok) {
      const apiError = await response.json();
      return { error: "Error Updating User: " + apiError.error.message };
    }
    const managerResponse = await fetch("http://localhost:8900/api/managers", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userID: employeeID,
        managerID: managerID,
      }),
    });
    if (!managerResponse.ok) {
      const apiError = await managerResponse.json();
      return { error: "Error Updating Manager: " + apiError.error.message };
    }
    return redirect("/admin");
  } catch (error) {
    return { error: "Error when performing update: " + error };
  }
}

export default function editUser() {
  const {
    token,
    userID,
    role,
    employeeData,
    employeeManagerData,
    allManagersData,
  } = useLoaderData<LoaderData>();

  const [usersRole, setUsersRole] = useState(employeeData.roleID.name);
  const [usersManager, setUsersManager] = useState(
    employeeManagerData?.managerID.userID || null
  );
  const [usersLeaveBalance, setUsersLeaveBalance] = useState<number>(
    employeeData.annualLeaveBalance
  );

  const actionData = useActionData<typeof action>();

  return (
    <>
      <NavigationBar role={role} />
      <h2>Edit User</h2>

      <h3>User Data:</h3>
      <p>Name: {`${employeeData.firstname} ${employeeData.surname}`}</p>
      <p>Email: {employeeData.email}</p>

      <label htmlFor="leave-balance-change">Annual Leave Balance:</label>
      <div className="select-wrapper">
        <input
          type="number"
          id="leave-balance-change"
          value={usersLeaveBalance}
          onChange={(e) => setUsersLeaveBalance(Number(e.target.value))}
        />
      </div>

      <label htmlFor="role-select">Role:</label>
      <div className="select-wrapper">
        <select
          id="role-select"
          value={usersRole}
          onChange={(e) => setUsersRole(e.target.value)}
        >
          <option value="Employee">Employee</option>
          <option value="Manager">Manager</option>
          <option value="Admin">Admin</option>
        </select>
      </div>

      <label htmlFor="manager-select">Manager:</label>
      <div className="select-wrapper">
        <select
          id="manager-select"
          value={usersManager ?? ""}
          onChange={(e) => setUsersManager(Number(e.target.value))}
        >
          {allManagersData.map((manager) => (
            <option key={manager.userID} value={manager.userID}>
              {`${manager.firstname} ${manager.surname}`}
            </option>
          ))}
        </select>
      </div>
      {actionData?.error && <p className="error">{actionData.error}</p>}
      <div className="horizontal-container">
        <Form method="post">
          <button type="submit">Save Changes</button>
          <input
            type="hidden"
            name="roleID"
            value={employeeData.roleID.roleID}
          />
          <input type="hidden" name="managerID" value={usersManager ?? ""} />
          <input type="hidden" name="leaveBalance" value={usersLeaveBalance} />
          <input type="hidden" name="userID" value={employeeData.userID} />
          <input type="hidden" name="email" value={employeeData.email} />
          <input
            type="hidden"
            name="firstname"
            value={employeeData.firstname}
          />
          <input type="hidden" name="surname" value={employeeData.surname} />
        </Form>
      </div>
    </>
  );
}
