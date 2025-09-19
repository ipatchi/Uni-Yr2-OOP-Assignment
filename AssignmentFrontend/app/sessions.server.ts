import { createCookieSessionStorage, redirect } from "react-router";

type User = {
  id: string;
  email: string;
  password: string;
  role: string;
};

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: 60 * 5,
    path: "/",
    sameSite: "lax",
    secrets: ["s3cr3t"],
    secure: process.env.NODE_ENV === "production",
  },
});

export const { commitSession, destroySession, getSession } = sessionStorage;

const getUserSession = async (request: Request) => {
  return await sessionStorage.getSession(request.headers.get("Cookie"));
};

export async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

export async function getToken(
  request: Request
): Promise<User["id"] | undefined> {
  const session = await getUserSession(request);
  const token = session.get("token");
  return token;
}

export async function getUserID(
  request: Request
): Promise<User["id"] | undefined> {
  const session = await getUserSession(request);
  const userID = session.get("userID");
  return userID;
}

export async function getUserRole(
  request: Request
): Promise<User["role"] | undefined> {
  const session = await getUserSession(request);
  const role = session.get("role");
  return role;
}

export async function createUserSession({
  request,
  token,
  userID,
  role,
  remember = true,
  redirectTo = "/",
}: {
  request: Request;
  token: string;
  userID: string;
  role: string;
  remember?: boolean;
  redirectTo?: string;
}) {
  const session = await getUserSession(request);
  session.set("token", token);
  session.set("userID", userID);
  session.set("role", role);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitSession(session, {
        maxAge: remember ? 60 * 5 : undefined,
      }),
    },
  });
}
