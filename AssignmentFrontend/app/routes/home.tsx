import { Form, redirect, useLoaderData } from "react-router";
import type { Route } from "./+types/login";
import { getToken, getUserID, getUserRole } from "~/sessions.server";
import { use } from "react";
import RequestRow from "~/components/requestRow";
import NavigationBar from "~/components/navigationBar";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Leave Request - Home" },
    { name: "description", content: "Welcome to the Leave Request system!" },
  ];
}

type LoaderData = {
  token: string;
  userID: string;
  role: number;
  requests: any[];
  balance: number;
};

export async function loader({ request }: Route.LoaderArgs) {
  const token = await getToken(request);
  const userID = await getUserID(request);
  const role = await getUserRole(request);
  if (!token || !userID || !role) {
    return redirect("/");
  }
  const reqsResponse = await fetch(
    `http://localhost:8900/api/leave-requests/status/${userID}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const requests = reqsResponse.ok ? (await reqsResponse.json()).data : [];
  const balanceResponse = await fetch(
    `http://localhost:8900/api/leave-requests/remaining/${userID}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const balance = balanceResponse.ok
    ? (await balanceResponse.json()).data.leaveBalance
    : 0;
  console.log("Balance Received:", balance);
  return { token, userID, role, requests, balance };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const userID = await getUserID(request);
  const token = await getToken(request);
  if (!token || !userID) {
    return redirect("/");
  }

  const intent = formData.get("_action");

  if (intent === "cancelRequest") {
    const leaveRequestID = formData.get("leaveRequestID");
    if (!leaveRequestID) {
      console.error("Leave Request ID is required to cancel a request");
      return null;
    }
    console.log(
      "Cancelling Leave Request ID:",
      leaveRequestID,
      "for User ID:",
      userID
    );
    console.log(
      JSON.stringify({ leaveRequestID: leaveRequestID, userID: userID })
    );
    const response = await fetch(`http://localhost:8900/api/leave-requests`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ leaveRequestID: leaveRequestID, userID: userID }),
    });
    if (!response.ok) {
      console.error("Failed to cancel leave request", await response.text());
      return null;
    }
  }
}

export default function Home() {
  const { token, userID, role, requests, balance } =
    useLoaderData<LoaderData>();
  console.log("Role", role);

  return (
    <>
      <h1>Home Page</h1>
      <NavigationBar role={role} />
      <p>Your remaining leave balance is: {balance} days</p>
      <h2>Your Leave Requests:</h2>
      {requests.length === 0 ? (
        <p>You have no leave requests.</p>
      ) : (
        <ul>
          {requests.map((request) => (
            <RequestRow key={request.leaveRequestID} request={request} />
          ))}
        </ul>
      )}
    </>
  );
}
