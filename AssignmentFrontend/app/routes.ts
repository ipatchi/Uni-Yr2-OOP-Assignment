import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/login.tsx"),
  route("/home", "routes/home.tsx"),
  route("/logout", "routes/logout.tsx"),
  route("/new-request", "routes/newRequest.tsx"),
  route("/manager", "routes/manager.tsx"),
] satisfies RouteConfig;
