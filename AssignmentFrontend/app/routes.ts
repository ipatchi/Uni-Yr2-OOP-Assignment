import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/login.tsx"),
  route("/home", "routes/home.tsx"),
  route("/logout", "routes/logout.tsx"),
  route("/new-request", "routes/newRequest.tsx"),
  route("/manager", "routes/manager.tsx"),
  route("/admin", "routes/admin/admin.tsx"),
  route("/admin/edit-user/:employeeID", "routes/admin/editUser.tsx"),
] satisfies RouteConfig;
