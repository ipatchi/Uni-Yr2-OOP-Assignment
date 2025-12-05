import { Form, redirect, useActionData, useLoaderData } from "react-router";
import type { Route } from "../+types/login";
import { getToken, getUserID, getUserRole } from "~/sessions.server";
import type { User } from "~/types/user";
import type { Management } from "~/types/management";
import { useState } from "react";
import NavigationBar from "~/components/navigationBar";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Leave Request - Admin - New User" },
    { name: "description", content: "Add a new user to the system." },
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
  allManagersData: User[];
};

export async function loader({ request, params }: LoaderArgs) {
  console.log("Attempting to load new user page");
  const token = await getToken(request);
  const userID = await getUserID(request);
  const role = await getUserRole(request);
  if (!token || !userID || !role) {
    return redirect("/");
  }
  if (Number(role) !== 1) {
    return redirect("/home");
  }

  const allManagers = await fetch(`${process.env.API_URL}/api/users`, {
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
    allManagersData,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password1 = formData.get("password1");
  const password2 = formData.get("password2");
  const roleID = formData.get("roleID");
  const firstname = formData.get("firstname");
  const surname = formData.get("surname");
  const managerID = formData.get("managerID");

  const token = await getToken(request);
  if (!token) {
    return redirect("/");
  }
  if (
    !email ||
    !firstname ||
    !surname ||
    !password1 ||
    !password2 ||
    !roleID ||
    !managerID
  ) {
    return { error: "Error: All fields are required." };
  }
  if (password1 !== password2) {
    return { error: "Error: Passwords do not match." };
  }

  try {
    const response = await fetch(`${process.env.API_URL}/api/users`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password1,
        roleID: roleID,
        firstname: firstname,
        surname: surname,
      }),
    });
    if (!response.ok) {
      const apiError = await response.json();
      return { error: "Error: " + apiError.error.message };
    }

    const newUser = await response.json();
    const newUserID = newUser.data.userID;

    const managerResponse = await fetch(`${process.env.API_URL}/api/managers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userID: newUserID,
        managerID: managerID,
      }),
    });
    if (!managerResponse.ok) {
      const apiError = await managerResponse.json();
      return { error: "Error Assigning Manager: " + apiError.error.message };
    }
    redirect("/admin");

    return redirect("/admin");
  } catch (error) {
    return { error: "Error when creating user: " + error };
  }
}

export default function newUser() {
  const actionData = useActionData<typeof action>();
  const { allManagersData, role } = useLoaderData<LoaderData>();

  return (
    <>
      <NavigationBar role={role} />
      <h2>Create New User</h2>
      {actionData?.error && <p style={{ color: "red" }}>{actionData.error}</p>}
      <div className="large-form-container">
        <Form method="post">
          <div>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              name="email"
              required
              placeholder="Enter email"
            />
          </div>

          <div>
            <label htmlFor="password1">Password:</label>
            <input
              type="password"
              name="password1"
              required
              placeholder="Enter password"
            />
          </div>

          <div>
            <label htmlFor="password2">Confirm Password:</label>
            <input
              type="password"
              name="password2"
              required
              placeholder="Confirm password"
            />
          </div>

          <div>
            <label htmlFor="roleID">Role:</label>
            <select name="roleID" id="roleID" required>
              <option value="3">Employee</option>
              <option value="2">Manager</option>
              <option value="1">Admin</option>
            </select>
          </div>

          <div>
            <label htmlFor="firstname">First Name:</label>
            <input
              type="text"
              name="firstname"
              required
              placeholder="Enter first name"
            />
          </div>

          <div>
            <label htmlFor="surname">Surname:</label>
            <input
              type="text"
              name="surname"
              required
              placeholder="Enter surname"
            />
          </div>

          <div>
            <label htmlFor="managerID">Manager:</label>
            <select name="managerID" id="managerID" required>
              {allManagersData.map((manager: User) => (
                <option key={manager.userID} value={manager.userID}>
                  {`${manager.firstname} ${manager.surname}`}
                </option>
              ))}
            </select>
          </div>

          <button type="submit">Create User</button>
        </Form>
      </div>
    </>
  );
}
