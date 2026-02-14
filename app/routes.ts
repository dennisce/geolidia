import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
  index("routes/home.tsx"),     // /
  route("heat", "routes/heat.tsx"), // /heat
  route("lidia", "routes/lidia.tsx"), // /lidia
] satisfies RouteConfig
