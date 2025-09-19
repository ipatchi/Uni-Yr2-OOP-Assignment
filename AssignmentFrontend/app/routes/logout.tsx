import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import { logout } from '~/sessions.server';

export async function action({ request }: ActionFunctionArgs) {
  return logout(request);
}

export function loader({request} : LoaderFunctionArgs) {
    return redirect("/");
}

export default function LogoutPage() {
  return null;
}