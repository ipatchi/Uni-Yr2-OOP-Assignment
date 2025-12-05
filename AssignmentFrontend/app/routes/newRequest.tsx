import { Form, redirect, useActionData, useLoaderData } from "react-router";
import type { Route } from "./+types/login";
import { getToken, getUserID, getUserRole } from "~/sessions.server";
import NavigationBar from "~/components/navigationBar";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Leave Request - New Leave Request" },
    { name: "description", content: "Create new leave requests" },
  ];
}

type LoaderData = {
  role: number;
};
export async function loader({ request }: Route.LoaderArgs) {
  const token = await getToken(request);
  const userID = await getUserID(request);
  const role = await getUserRole(request);
  if (!token || !userID || !role) {
    return redirect("/");
  }
  return { token, userID, role };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const startDate = formData.get("startDate");
  const endDate = formData.get("endDate");
  const reason = formData.get("reason");

  const errors: { startDate?: string; endDate?: string; form?: string } = {};

  if (!startDate) {
    errors.startDate = "Start Date is required";
  }

  if (!endDate) {
    errors.endDate = "End Date is required";
  }

  if (Object.keys(errors).length > 0) {
    return JSON.stringify(errors);
  }

  const token = await getToken(request);
  const userID = await getUserID(request);
  if (!token || !userID) {
    return redirect("/");
  }

  const response = await fetch(`${process.env.API_URL}/api/leave-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      userID,
      startDate,
      endDate,
      reason,
    }),
  });

  if (!response.ok) {
    const apiErrors = await response.json();
    errors.form = "Error: " + apiErrors.error.message;
    return JSON.stringify(errors);
  }

  return redirect("/home");
}

export default function newRequest() {
  const actionDataRaw = useActionData<typeof action>();
  const { role } = useLoaderData<LoaderData>();
  const actionData:
    | { startDate?: string; endDate?: string; form?: string }
    | undefined =
    typeof actionDataRaw === "string" ? JSON.parse(actionDataRaw) : undefined;

  return (
    <>
      <NavigationBar role={role} />
      <h2>New Leave Request</h2>
      <div className="horizontal-container">
        <Form action="" method="post">
          <label htmlFor="startDate">Start Date:</label>
          <input type="date" name="startDate" id="startDate" required />
          <p className="error">{actionData?.startDate}</p>
          <label htmlFor="endDate">End Date:</label>
          <input type="date" name="endDate" id="endDate" required />
          <p className="error">{actionData?.endDate}</p>
          <label htmlFor="reason">Reason:</label>
          <input type="text" name="reason" id="reason" />
          <button type="submit">Submit</button>
          <p className="error">{actionData?.form}</p>
        </Form>
      </div>
    </>
  );
}
