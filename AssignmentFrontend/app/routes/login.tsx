import type { ActionFunctionArgs } from 'react-router';
import type { Route } from './+types/login';

export async function sendLogin({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");

  if (!username) {
    return {
      error: "Username is required"
    }
  }
  if (!password) {
    return {
      error: 'Password is required',
    };
  }

  const response = await fetch("")
}

export default function Login() {
  return (
    <>
      <h1>Login</h1>
    </>
  );
}
