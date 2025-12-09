import { Form, type ActionFunctionArgs, useActionData } from "react-router";
import { createUserSession } from "~/sessions.server";
import type { Route } from "./+types/login";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Leave Request - Login" },
    {
      name: "description",
      content: "Welcome to the Leave Request system, please log in!",
    },
  ];
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  if (!email) {
    return { error: "Email is required" };
  }
  if (!password) {
    return { error: "Password is required" };
  }

  try {
    const response = await fetch(`${process.env.VITE_API_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email, password: password }),
    });

    if (!response.ok) {
      const apiError = await response.json();
      return { error: "Error: " + apiError.error.message };
    }

    const token = await response.text();

    const user = await fetch(
      `${process.env.VITE_API_URL}/api/users/email/${email}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!user.ok) {
      const apiError = await user.json();
      return { error: "Error: " + apiError.error.message };
    }

    const { data } = await user.json();
    console.log("UserID Received:", data.userID);
    console.log("Token Received:", token);
    return createUserSession({
      request,
      token,
      userID: data.userID,
      role: data.roleID.roleID,
      remember: true,
      redirectTo: "/home",
    });
  } catch (error) {
    return { error: "Error: " + error };
  }
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  return (
    <div className="card-container">
      <h2>Sign In</h2>
      <Form method="post">
        <label htmlFor="email">Email:</label>
        <div>
          <input type="email" id="email" name="email" required />
        </div>
        <label htmlFor="password">Password:</label>
        <div>
          <input type="password" id="password" name="password" required />
        </div>

        {actionData?.error && <p className="error">{actionData.error}</p>}

        <input type="submit" value="Login" />
      </Form>
    </div>
  );
}
