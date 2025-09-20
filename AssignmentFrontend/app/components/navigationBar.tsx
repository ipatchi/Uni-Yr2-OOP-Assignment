import { Form } from "react-router";

export default function navigationBar({ role }: { role: number }) {
  return (
    <nav className="horizontal-container">
      <Form action="/home" method="post">
        <button type="submit">Home</button>
      </Form>
      <Form action="/new-request" method="post">
        <button type="submit">New Leave Request</button>
      </Form>
      {(role === 1 || role === 2) && (
        <Form action="/manager" method="post">
          <button type="submit">Manager</button>
        </Form>
      )}
      {role === 1 && (
        <Form action="/admin" method="post">
          <button type="submit">Admin</button>
        </Form>
      )}
      <Form action="/logout" method="post">
        <button type="submit">Logout</button>
      </Form>
    </nav>
  );
}
